/**
 * Luau source templates for the generated Rojo project.
 * Design principles baked into every file (and explained in comments there):
 * - The client REQUESTS, the server DECIDES. No currency/item mutation on the client.
 * - Every remote call is type-validated and rate-limited.
 * - DataStore access is wrapped in retries + session locking.
 * All code is original work; no external IP.
 */

export const NET_LUAU = `--!strict
-- Net: central registry for all RemoteEvents/RemoteFunctions.
-- Contract: the SERVER creates instances, the CLIENT only waits for them.
-- Adding a remote here is the only sanctioned way to add client<->server traffic.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local REMOTE_EVENTS = {
	"CurrencyChanged",   -- server -> client: (currency: string, newAmount: number)
	"QuestUpdated",      -- server -> client: (questId: string, progress: number, goal: number, completed: boolean)
	"Notify",            -- server -> client: (message: string, kind: string)
}

local REMOTE_FUNCTIONS = {
	"PurchaseItem",      -- client -> server: (itemId: string) -> (ok: boolean, message: string)
	"ClaimQuest",        -- client -> server: (questId: string) -> (ok: boolean, message: string)
}

local Net = {}

local function getOrCreateFolder(): Folder
	local existing = ReplicatedStorage:FindFirstChild("Remotes")
	if existing and existing:IsA("Folder") then
		return existing
	end
	local folder = Instance.new("Folder")
	folder.Name = "Remotes"
	folder.Parent = ReplicatedStorage
	return folder
end

function Net.server()
	assert(RunService:IsServer(), "Net.server() darf nur auf dem Server laufen")
	local folder = getOrCreateFolder()
	local remotes: { [string]: RemoteEvent | RemoteFunction } = {}
	for _, name in REMOTE_EVENTS do
		local remote = Instance.new("RemoteEvent")
		remote.Name = name
		remote.Parent = folder
		remotes[name] = remote
	end
	for _, name in REMOTE_FUNCTIONS do
		local remote = Instance.new("RemoteFunction")
		remote.Name = name
		remote.Parent = folder
		remotes[name] = remote
	end
	return remotes
end

function Net.client()
	local folder = ReplicatedStorage:WaitForChild("Remotes")
	local remotes: { [string]: Instance } = {}
	for _, name in REMOTE_EVENTS do
		remotes[name] = folder:WaitForChild(name)
	end
	for _, name in REMOTE_FUNCTIONS do
		remotes[name] = folder:WaitForChild(name)
	end
	return remotes
end

return Net
`;

export const TYPES_LUAU = `--!strict
-- Shared type definitions. PlayerData is the single persisted document per player.

export type QuestProgress = {
	progress: number,
	claimed: boolean,
	day: string, -- ISO date the quest was assigned (daily reset)
}

export type PlayerData = {
	schemaVersion: number,
	currencies: { [string]: number },
	upgrades: { [string]: number },
	quests: { [string]: QuestProgress },
	stats: {
		totalPlayTimeSeconds: number,
		joins: number,
	},
}

local Types = {}

function Types.defaultPlayerData(startingCurrencies: { [string]: number }): PlayerData
	local currencies: { [string]: number } = {}
	for name, amount in startingCurrencies do
		currencies[name] = amount
	end
	return {
		schemaVersion = 1,
		currencies = currencies,
		upgrades = {},
		quests = {},
		stats = { totalPlayTimeSeconds = 0, joins = 0 },
	}
end

return Types
`;

export const DATA_SERVICE_LUAU = `--!strict
-- DataService: persistence with retries, session locking and autosave.
-- Session lock: an UpdateAsync-guarded timestamp prevents two servers from
-- writing the same profile concurrently (e.g. after a quick rejoin).

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))
local Types = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Types"))

local STORE_NAME = "PlayerData_v1"
local LOCK_TIMEOUT_SECONDS = 120
local AUTOSAVE_INTERVAL = 60
local MAX_RETRIES = 4

local DataService = {}
local store = DataStoreService:GetDataStore(STORE_NAME)
local profiles: { [Player]: Types.PlayerData } = {}
local dirty: { [Player]: boolean } = {}

local function keyFor(player: Player): string
	return "p_" .. tostring(player.UserId)
end

local function withRetries<T>(label: string, fn: () -> T): (boolean, T?)
	local delaySeconds = 0.5
	for attempt = 1, MAX_RETRIES do
		local ok, result = pcall(fn)
		if ok then
			return true, result
		end
		warn(string.format("[DataService] %s fehlgeschlagen (Versuch %d/%d): %s", label, attempt, MAX_RETRIES, tostring(result)))
		task.wait(delaySeconds)
		delaySeconds = delaySeconds * 2
	end
	return false, nil
end

type Envelope = { lockedAt: number?, lockedBy: string?, data: Types.PlayerData? }

local function tryAcquire(player: Player): Types.PlayerData?
	local acquired: Types.PlayerData? = nil
	local ok = withRetries("Laden+Lock", function()
		store:UpdateAsync(keyFor(player), function(raw: Envelope?)
			local envelope: Envelope = raw or {}
			local now = os.time()
			if envelope.lockedAt and (now - envelope.lockedAt) < LOCK_TIMEOUT_SECONDS and envelope.lockedBy ~= game.JobId then
				-- Another live server holds the profile; do not steal it.
				acquired = nil
				return nil -- abort write
			end
			envelope.lockedAt = now
			envelope.lockedBy = game.JobId
			envelope.data = envelope.data or Types.defaultPlayerData(Config.StartingCurrencies)
			acquired = envelope.data
			return envelope
		end)
		return true
	end)
	if not ok then
		return nil
	end
	return acquired
end

local function saveAndMaybeUnlock(player: Player, unlock: boolean)
	local profile = profiles[player]
	if profile == nil then
		return
	end
	withRetries("Speichern", function()
		store:UpdateAsync(keyFor(player), function(raw: Envelope?)
			local envelope: Envelope = raw or {}
			envelope.data = profile
			if unlock then
				envelope.lockedAt = nil
				envelope.lockedBy = nil
			else
				envelope.lockedAt = os.time()
				envelope.lockedBy = game.JobId
			end
			return envelope
		end)
		return true
	end)
	dirty[player] = false
end

function DataService.get(player: Player): Types.PlayerData?
	return profiles[player]
end

function DataService.markDirty(player: Player)
	dirty[player] = true
end

function DataService.init()
	Players.PlayerAdded:Connect(function(player)
		local data = tryAcquire(player)
		if data == nil then
			player:Kick("Deine Daten sind noch auf einem anderen Server gesperrt. Bitte in ein paar Sekunden erneut beitreten.")
			return
		end
		data.stats.joins += 1
		profiles[player] = data
	end)

	Players.PlayerRemoving:Connect(function(player)
		saveAndMaybeUnlock(player, true)
		profiles[player] = nil
		dirty[player] = nil
	end)

	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_INTERVAL)
			for player, isDirty in dirty do
				if isDirty and profiles[player] ~= nil then
					saveAndMaybeUnlock(player, false)
				end
			end
		end
	end)

	game:BindToClose(function()
		for player in profiles do
			saveAndMaybeUnlock(player, true)
		end
	end)
end

return DataService
`;

export const ECONOMY_SERVICE_LUAU = `--!strict
-- EconomyService: the ONLY place currency changes. Client never mutates
-- balances - it only renders what the server broadcasts.

local DataService = require(script.Parent:WaitForChild("DataService"))

local EconomyService = {}
local remotes: { [string]: Instance } = {}

function EconomyService.init(netRemotes: { [string]: Instance })
	remotes = netRemotes
end

local function broadcast(player: Player, currency: string, amount: number)
	local event = remotes["CurrencyChanged"]
	if event and event:IsA("RemoteEvent") then
		event:FireClient(player, currency, amount)
	end
end

function EconomyService.getBalance(player: Player, currency: string): number
	local data = DataService.get(player)
	if data == nil then
		return 0
	end
	return data.currencies[currency] or 0
end

function EconomyService.addCurrency(player: Player, currency: string, amount: number): boolean
	if type(amount) ~= "number" or amount ~= amount or amount <= 0 or amount ~= math.floor(amount) then
		return false -- reject NaN, negative, fractional
	end
	local data = DataService.get(player)
	if data == nil then
		return false
	end
	data.currencies[currency] = (data.currencies[currency] or 0) + amount
	DataService.markDirty(player)
	broadcast(player, currency, data.currencies[currency] :: number)
	return true
end

function EconomyService.spendCurrency(player: Player, currency: string, amount: number): boolean
	if type(amount) ~= "number" or amount ~= amount or amount <= 0 or amount ~= math.floor(amount) then
		return false
	end
	local data = DataService.get(player)
	if data == nil then
		return false
	end
	local balance = data.currencies[currency] or 0
	if balance < amount then
		return false
	end
	data.currencies[currency] = balance - amount
	DataService.markDirty(player)
	broadcast(player, currency, data.currencies[currency] :: number)
	return true
end

return EconomyService
`;

export const ANTI_EXPLOIT_LUAU = `--!strict
-- AntiExploitService: baseline protections every multiplayer experience needs.
-- 1) Token-bucket rate limiter for remotes (per player, per remote).
-- 2) Argument validation helpers (type + sanity checks).
-- 3) Movement sanity loop: flags players moving far beyond possible speed.
-- Policy: kick only after repeated violations - false positives (lag, teleports
-- by game code) must not punish honest players.

local Players = game:GetService("Players")

local AntiExploitService = {}

local buckets: { [Player]: { [string]: { tokens: number, last: number } } } = {}
local violations: { [Player]: number } = {}

local RATE_LIMIT_TOKENS = 8      -- burst size
local RATE_LIMIT_REFILL = 4      -- tokens per second
local VIOLATIONS_BEFORE_KICK = 12
local MAX_HORIZONTAL_SPEED = 80  -- studs/s, tune to your fastest legit movement

function AntiExploitService.allowRemote(player: Player, remoteName: string): boolean
	local playerBuckets = buckets[player]
	if playerBuckets == nil then
		playerBuckets = {}
		buckets[player] = playerBuckets
	end
	local bucket = playerBuckets[remoteName]
	local now = os.clock()
	if bucket == nil then
		bucket = { tokens = RATE_LIMIT_TOKENS, last = now }
		playerBuckets[remoteName] = bucket
	end
	bucket.tokens = math.min(RATE_LIMIT_TOKENS, bucket.tokens + (now - bucket.last) * RATE_LIMIT_REFILL)
	bucket.last = now
	if bucket.tokens < 1 then
		AntiExploitService.flag(player, "Rate-Limit: " .. remoteName)
		return false
	end
	bucket.tokens -= 1
	return true
end

function AntiExploitService.expectString(value: unknown, maxLength: number): string?
	if type(value) ~= "string" then
		return nil
	end
	if #value == 0 or #value > maxLength then
		return nil
	end
	return value
end

function AntiExploitService.flag(player: Player, reason: string)
	violations[player] = (violations[player] or 0) + 1
	warn(string.format("[AntiExploit] %s: %s (%d/%d)", player.Name, reason, violations[player] :: number, VIOLATIONS_BEFORE_KICK))
	if (violations[player] :: number) >= VIOLATIONS_BEFORE_KICK then
		player:Kick("Verbindung wegen wiederholt ungültiger Anfragen getrennt.")
	end
end

function AntiExploitService.init()
	Players.PlayerRemoving:Connect(function(player)
		buckets[player] = nil
		violations[player] = nil
	end)

	-- Movement sanity loop (coarse on purpose; refine per game).
	local lastPositions: { [Player]: Vector3 } = {}
	task.spawn(function()
		while true do
			task.wait(1)
			for _, player in Players:GetPlayers() do
				local character = player.Character
				local root = character and character:FindFirstChild("HumanoidRootPart")
				if root and root:IsA("BasePart") then
					local previous = lastPositions[player]
					local current = root.Position
					if previous then
						local horizontal = Vector3.new(current.X - previous.X, 0, current.Z - previous.Z).Magnitude
						if horizontal > MAX_HORIZONTAL_SPEED then
							AntiExploitService.flag(player, string.format("Bewegung: %.0f studs/s", horizontal))
						end
					end
					lastPositions[player] = current
				end
			end
		end
	end)
end

return AntiExploitService
`;

export const LEADERSTATS_LUAU = `--!strict
-- LeaderstatsService: mirrors selected currencies into the Roblox leaderboard.

local Players = game:GetService("Players")
local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))
local DataService = require(script.Parent:WaitForChild("DataService"))

local LeaderstatsService = {}

local function buildFor(player: Player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	stats.Parent = player
	for _, currencyName in Config.LeaderstatCurrencies do
		local value = Instance.new("IntValue")
		value.Name = currencyName
		value.Value = 0
		value.Parent = stats
	end
end

function LeaderstatsService.sync(player: Player)
	local data = DataService.get(player)
	local stats = player:FindFirstChild("leaderstats")
	if data == nil or stats == nil then
		return
	end
	for _, currencyName in Config.LeaderstatCurrencies do
		local value = stats:FindFirstChild(currencyName)
		if value and value:IsA("IntValue") then
			value.Value = data.currencies[currencyName] or 0
		end
	end
end

function LeaderstatsService.init()
	Players.PlayerAdded:Connect(function(player)
		buildFor(player)
		-- Data loads async; poll briefly until the profile is ready.
		task.spawn(function()
			for _ = 1, 50 do
				if DataService.get(player) ~= nil then
					LeaderstatsService.sync(player)
					return
				end
				task.wait(0.2)
			end
		end)
	end)

	task.spawn(function()
		while true do
			task.wait(2)
			for _, player in Players:GetPlayers() do
				LeaderstatsService.sync(player)
			end
		end
	end)
end

return LeaderstatsService
`;

export const SHOP_SERVICE_LUAU = `--!strict
-- ShopService: catalog lives in Config (server-authoritative prices).
-- The client sends an item id; the server checks price, balance and ownership.
-- MonetizationService hooks (Game Passes / Developer Products) are prepared
-- below - fill in your ids from the Creator Dashboard.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))
local DataService = require(script.Parent:WaitForChild("DataService"))
local EconomyService = require(script.Parent:WaitForChild("EconomyService"))
local AntiExploitService = require(script.Parent:WaitForChild("AntiExploitService"))

local ShopService = {}

function ShopService.init(remotes: { [string]: Instance })
	local purchase = remotes["PurchaseItem"]
	assert(purchase and purchase:IsA("RemoteFunction"), "PurchaseItem RemoteFunction fehlt")

	purchase.OnServerInvoke = function(player: Player, rawItemId: unknown): (boolean, string)
		if not AntiExploitService.allowRemote(player, "PurchaseItem") then
			return false, "Zu viele Anfragen - kurz warten."
		end
		local itemId = AntiExploitService.expectString(rawItemId, 64)
		if itemId == nil then
			AntiExploitService.flag(player, "PurchaseItem: ungültiges Argument")
			return false, "Ungültige Anfrage."
		end
		local item = Config.ShopCatalog[itemId]
		if item == nil then
			return false, "Unbekannter Artikel."
		end
		local data = DataService.get(player)
		if data == nil then
			return false, "Daten noch nicht geladen."
		end
		if item.maxOwned ~= nil and (data.upgrades[itemId] or 0) >= item.maxOwned then
			return false, "Bereits im Besitz."
		end
		if not EconomyService.spendCurrency(player, item.currency, item.price) then
			return false, "Nicht genug " .. item.currency .. "."
		end
		data.upgrades[itemId] = (data.upgrades[itemId] or 0) + 1
		DataService.markDirty(player)
		return true, item.displayName .. " gekauft!"
	end

	-- ------------------------------------------------------------------
	-- Robux monetization hooks (optional):
	-- 1) Create Game Passes / Developer Products in the Creator Dashboard.
	-- 2) Put their ids into Config.GamePasses / Config.DeveloperProducts.
	-- 3) Grant effects below. ProcessReceipt MUST be idempotent.
	-- ------------------------------------------------------------------
	MarketplaceService.ProcessReceipt = function(receiptInfo)
		local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
		if player == nil then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		local product = Config.DeveloperProducts[tostring(receiptInfo.ProductId)]
		if product == nil then
			warn("[ShopService] Unbekanntes Developer Product: " .. tostring(receiptInfo.ProductId))
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		local granted = EconomyService.addCurrency(player, product.currency, product.amount)
		if granted then
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
end

return ShopService
`;

export const QUEST_SERVICE_LUAU = `--!strict
-- QuestService: daily quests, assigned per calendar day, claimed via remote.
-- Progress is tracked server-side only; the client just renders.

local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))
local DataService = require(script.Parent:WaitForChild("DataService"))
local EconomyService = require(script.Parent:WaitForChild("EconomyService"))
local AntiExploitService = require(script.Parent:WaitForChild("AntiExploitService"))

local QuestService = {}
local remotes: { [string]: Instance } = {}

local function today(): string
	return os.date("!%Y-%m-%d") :: string
end

local function pushUpdate(player: Player, questId: string)
	local data = DataService.get(player)
	local quest = Config.DailyQuests[questId]
	if data == nil or quest == nil then
		return
	end
	local state = data.quests[questId]
	local event = remotes["QuestUpdated"]
	if state and event and event:IsA("RemoteEvent") then
		event:FireClient(player, questId, state.progress, quest.goal, state.progress >= quest.goal)
	end
end

function QuestService.ensureDailyQuests(player: Player)
	local data = DataService.get(player)
	if data == nil then
		return
	end
	local day = today()
	for questId in Config.DailyQuests do
		local state = data.quests[questId]
		if state == nil or state.day ~= day then
			data.quests[questId] = { progress = 0, claimed = false, day = day }
		end
	end
	DataService.markDirty(player)
end

-- Call this from gameplay code whenever a quest-relevant action happens.
function QuestService.addProgress(player: Player, questId: string, amount: number)
	local data = DataService.get(player)
	local quest = Config.DailyQuests[questId]
	if data == nil or quest == nil or amount <= 0 then
		return
	end
	QuestService.ensureDailyQuests(player)
	local state = data.quests[questId]
	if state == nil or state.claimed then
		return
	end
	state.progress = math.min(quest.goal, state.progress + amount)
	DataService.markDirty(player)
	pushUpdate(player, questId)
end

function QuestService.init(netRemotes: { [string]: Instance })
	remotes = netRemotes
	local claim = remotes["ClaimQuest"]
	assert(claim and claim:IsA("RemoteFunction"), "ClaimQuest RemoteFunction fehlt")

	claim.OnServerInvoke = function(player: Player, rawQuestId: unknown): (boolean, string)
		if not AntiExploitService.allowRemote(player, "ClaimQuest") then
			return false, "Zu viele Anfragen."
		end
		local questId = AntiExploitService.expectString(rawQuestId, 64)
		if questId == nil then
			return false, "Ungültige Anfrage."
		end
		local quest = Config.DailyQuests[questId]
		local data = DataService.get(player)
		if quest == nil or data == nil then
			return false, "Unbekannte Quest."
		end
		QuestService.ensureDailyQuests(player)
		local state = data.quests[questId]
		if state == nil or state.progress < quest.goal then
			return false, "Quest noch nicht abgeschlossen."
		end
		if state.claimed then
			return false, "Belohnung bereits abgeholt."
		end
		state.claimed = true
		DataService.markDirty(player)
		EconomyService.addCurrency(player, quest.rewardCurrency, quest.rewardAmount)
		return true, "Belohnung erhalten: " .. tostring(quest.rewardAmount) .. " " .. quest.rewardCurrency
	end
end

return QuestService
`;

export const MATCH_SERVICE_LUAU = `--!strict
-- MatchService: lobby -> round -> results state machine for round-based play.
-- TeleportService integration (multi-place experiences) is prepared as a hook.

local Players = game:GetService("Players")

local MatchService = {}

export type MatchState = "Lobby" | "Starting" | "Running" | "Results"

local INTERMISSION_SECONDS = 15
local ROUND_SECONDS = 180
local MIN_PLAYERS = 2

local state: MatchState = "Lobby"
local stateChanged = Instance.new("BindableEvent")
MatchService.StateChanged = stateChanged.Event

local function setState(next: MatchState)
	state = next
	stateChanged:Fire(next)
end

function MatchService.getState(): MatchState
	return state
end

function MatchService.init()
	task.spawn(function()
		while true do
			setState("Lobby")
			-- Wait for enough players.
			while #Players:GetPlayers() < MIN_PLAYERS do
				task.wait(2)
			end
			setState("Starting")
			task.wait(INTERMISSION_SECONDS)

			-- Hook: for multi-place experiences, reserve a server and teleport here:
			-- local code = TeleportService:ReserveServer(GAME_PLACE_ID)
			-- TeleportService:TeleportToPrivateServer(GAME_PLACE_ID, code, players)

			setState("Running")
			local endTime = os.clock() + ROUND_SECONDS
			while os.clock() < endTime and #Players:GetPlayers() >= 1 do
				task.wait(1)
			end

			setState("Results")
			task.wait(8)
		end
	end)
end

return MatchService
`;

export const MAIN_SERVER_LUAU = `--!strict
-- Server bootstrap. Order matters:
-- 1) Net creates remotes (clients wait on them)
-- 2) Data layer, 3) Anti-exploit, 4) gameplay services.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Net = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Net"))
local Services = script.Parent:WaitForChild("Services")

local DataService = require(Services:WaitForChild("DataService"))
local AntiExploitService = require(Services:WaitForChild("AntiExploitService"))
local EconomyService = require(Services:WaitForChild("EconomyService"))
local LeaderstatsService = require(Services:WaitForChild("LeaderstatsService"))
local ShopService = require(Services:WaitForChild("ShopService"))
local QuestService = require(Services:WaitForChild("QuestService"))

local remotes = Net.server()

DataService.init()
AntiExploitService.init()
EconomyService.init(remotes)
LeaderstatsService.init()
ShopService.init(remotes)
QuestService.init(remotes)

Players.PlayerAdded:Connect(function(player)
	task.spawn(function()
		-- Wait for profile, then assign daily quests.
		for _ = 1, 50 do
			if DataService.get(player) ~= nil then
				QuestService.ensureDailyQuests(player)
				return
			end
			task.wait(0.2)
		end
	end)
end)

print("[Server] Alle Services gestartet.")
`;

export const MAIN_SERVER_WITH_MATCH_LUAU = MAIN_SERVER_LUAU.replace(
  'local QuestService = require(Services:WaitForChild("QuestService"))',
  'local QuestService = require(Services:WaitForChild("QuestService"))\nlocal MatchService = require(Services:WaitForChild("MatchService"))',
).replace(
  'QuestService.init(remotes)',
  'QuestService.init(remotes)\nMatchService.init()',
);

export const MAIN_CLIENT_LUAU = `--!strict
-- Client bootstrap: wires controllers to the server remotes.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Net = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Net"))

local Controllers = script.Parent:WaitForChild("Controllers")
local UIController = require(Controllers:WaitForChild("UIController"))
local InputController = require(Controllers:WaitForChild("InputController"))

local remotes = Net.client()

UIController.init(remotes)
InputController.init()

print("[Client] Controller gestartet.")
`;

export const UI_CONTROLLER_LUAU = `--!strict
-- UIController: minimal HUD built programmatically (no asset dependencies).
-- Shows currencies, notifications and the daily quest list.
-- Replace with your own ScreenGui designs as the game grows.

local Players = game:GetService("Players")

local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))

local UIController = {}

local function makeLabel(parent: Instance, name: string, position: UDim2): TextLabel
	local label = Instance.new("TextLabel")
	label.Name = name
	label.Size = UDim2.new(0, 220, 0, 34)
	label.Position = position
	label.BackgroundTransparency = 0.35
	label.BackgroundColor3 = Color3.fromRGB(20, 24, 34)
	label.TextColor3 = Color3.fromRGB(240, 242, 248)
	label.TextSize = 18
	label.Font = Enum.Font.GothamBold
	label.Text = ""
	label.Parent = parent
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 8)
	corner.Parent = label
	return label
end

function UIController.init(remotes: { [string]: Instance })
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	local screen = Instance.new("ScreenGui")
	screen.Name = "HUD"
	screen.ResetOnSpawn = false
	screen.Parent = playerGui

	local currencyLabels: { [string]: TextLabel } = {}
	local row = 0
	for _, currencyName in Config.LeaderstatCurrencies do
		local label = makeLabel(screen, "Currency_" .. currencyName, UDim2.new(0, 12, 0, 12 + row * 40))
		label.Text = currencyName .. ": 0"
		currencyLabels[currencyName] = label
		row += 1
	end

	local questLabel = makeLabel(screen, "Quests", UDim2.new(0, 12, 1, -90))
	questLabel.Size = UDim2.new(0, 320, 0, 34)
	questLabel.Text = "Tagesquests laufen..."

	local notify = makeLabel(screen, "Notify", UDim2.new(0.5, -160, 0, 12))
	notify.Size = UDim2.new(0, 320, 0, 34)
	notify.Visible = false

	local currencyChanged = remotes["CurrencyChanged"]
	if currencyChanged and currencyChanged:IsA("RemoteEvent") then
		currencyChanged.OnClientEvent:Connect(function(currency: string, amount: number)
			local label = currencyLabels[currency]
			if label then
				label.Text = currency .. ": " .. tostring(amount)
			end
		end)
	end

	local questUpdated = remotes["QuestUpdated"]
	if questUpdated and questUpdated:IsA("RemoteEvent") then
		questUpdated.OnClientEvent:Connect(function(questId: string, progress: number, goal: number, completed: boolean)
			local quest = Config.DailyQuests[questId]
			local title = quest and quest.title or questId
			questLabel.Text = string.format("%s: %d/%d%s", title, progress, goal, completed and " - abholbereit!" or "")
		end)
	end

	local notifyRemote = remotes["Notify"]
	if notifyRemote and notifyRemote:IsA("RemoteEvent") then
		notifyRemote.OnClientEvent:Connect(function(message: string)
			notify.Text = message
			notify.Visible = true
			task.delay(3, function()
				notify.Visible = false
			end)
		end)
	end
end

return UIController
`;

export const INPUT_CONTROLLER_LUAU = `--!strict
-- InputController: unified touch + desktop input via ContextActionService.
-- Bind your core action here so mobile players get an on-screen button for free.

local ContextActionService = game:GetService("ContextActionService")

local InputController = {}

local PRIMARY_ACTION = "PrimaryAction"

local function onPrimaryAction(_actionName: string, inputState: Enum.UserInputState): Enum.ContextActionResult
	if inputState == Enum.UserInputState.Begin then
		-- Hook: trigger the game's core action here (fire a remote, swing, collect...).
		-- Keep it client-predictive but server-validated.
	end
	return Enum.ContextActionResult.Pass
end

function InputController.init()
	ContextActionService:BindAction(PRIMARY_ACTION, onPrimaryAction, true, Enum.KeyCode.E, Enum.KeyCode.ButtonR2)
	ContextActionService:SetTitle(PRIMARY_ACTION, "Aktion")
	-- true above = create a touch button automatically on mobile.
end

return InputController
`;
