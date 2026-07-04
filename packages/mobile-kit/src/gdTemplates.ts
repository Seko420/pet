/**
 * GDScript / Godot 4.3 templates. GDScript is indentation-sensitive and uses
 * TABS here (matches Godot's default editor settings).
 * All gameplay code is original and intentionally dependency-free.
 */

export const GAME_STATE_GD = `extends Node
## Autoload "GameState": progression, currency and persistence.
## Save format is versioned JSON in user://save.json - never store secrets here.

const SAVE_PATH := "user://save.json"
const SCHEMA_VERSION := 1

var coins: int = 0
var best_score: int = 0
var upgrades: Dictionary = {}
var settings: Dictionary = {"sfx": true, "music": true}
var last_seen_unix: int = 0

func _ready() -> void:
	load_game()

func add_coins(amount: int) -> void:
	if amount <= 0:
		return
	coins += amount
	Analytics.track("currency_earned", {"amount": amount, "balance": coins})

func spend_coins(amount: int) -> bool:
	if amount <= 0 or coins < amount:
		return false
	coins -= amount
	return true

func save_game() -> void:
	last_seen_unix = int(Time.get_unix_time_from_system())
	var payload := {
		"schema_version": SCHEMA_VERSION,
		"coins": coins,
		"best_score": best_score,
		"upgrades": upgrades,
		"settings": settings,
		"last_seen_unix": last_seen_unix,
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("Speichern fehlgeschlagen: %s" % FileAccess.get_open_error())
		return
	file.store_string(JSON.stringify(payload))
	file.close()

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Save-Datei unlesbar - starte frisch.")
		return
	var data: Dictionary = parsed
	var version := int(data.get("schema_version", 1))
	# Migration hook: if version < SCHEMA_VERSION, transform data here.
	coins = int(data.get("coins", 0))
	best_score = int(data.get("best_score", 0))
	upgrades = data.get("upgrades", {})
	settings = data.get("settings", {"sfx": true, "music": true})
	last_seen_unix = int(data.get("last_seen_unix", 0))

func seconds_since_last_seen() -> int:
	if last_seen_unix <= 0:
		return 0
	return max(0, int(Time.get_unix_time_from_system()) - last_seen_unix)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()
`;

export const AUDIO_MANAGER_GD = `extends Node
## Autoload "AudioManager": central SFX/music playback with mute persistence.

var _sfx_player: AudioStreamPlayer
var _music_player: AudioStreamPlayer

func _ready() -> void:
	_sfx_player = AudioStreamPlayer.new()
	_music_player = AudioStreamPlayer.new()
	add_child(_sfx_player)
	add_child(_music_player)

func play_sfx(stream: AudioStream) -> void:
	if not GameState.settings.get("sfx", true):
		return
	_sfx_player.stream = stream
	_sfx_player.play()

func play_music(stream: AudioStream) -> void:
	if not GameState.settings.get("music", true):
		return
	if _music_player.stream == stream and _music_player.playing:
		return
	_music_player.stream = stream
	_music_player.play()

func set_sfx_enabled(enabled: bool) -> void:
	GameState.settings["sfx"] = enabled
	GameState.save_game()

func set_music_enabled(enabled: bool) -> void:
	GameState.settings["music"] = enabled
	if not enabled:
		_music_player.stop()
	GameState.save_game()
`;

export const ANALYTICS_GD = `extends Node
## Autoload "Analytics": privacy-first event tracking.
## Events land in a local ring buffer + debug log. Later: plug a real SDK
## adapter into _flush() - keep events sparse and anonymous (see privacy checklist).

const MAX_BUFFER := 200

var _buffer: Array[Dictionary] = []

func track(event_name: String, params: Dictionary = {}) -> void:
	var entry := {
		"name": event_name,
		"params": params,
		"t": int(Time.get_unix_time_from_system()),
	}
	_buffer.append(entry)
	if _buffer.size() > MAX_BUFFER:
		_buffer.pop_front()
	print_debug("[Analytics] %s %s" % [event_name, JSON.stringify(params)])

func _flush() -> void:
	# TODO: send _buffer to your analytics backend/SDK adapter here.
	# Rules: anonymized ids only, no PII, respect the project's privacy checklist.
	pass
`;

export const MONETIZATION_GD = `extends Node
## Autoload "Monetization": honest mock for IAP/rewarded ads.
## Real store plugins (Google Play Billing / AdMob) are a roadmap item -
## this mock keeps the game logic testable and makes the missing piece explicit.

signal purchase_finished(product_id: String, success: bool)
signal rewarded_ad_finished(success: bool)

var mock_mode := true

func buy_product(product_id: String) -> void:
	if mock_mode:
		push_warning("Monetization: Mock-Kauf '%s' (Store-Anbindung folgt laut Roadmap)." % product_id)
		Analytics.track("iap_purchase", {"product_id": product_id, "mock": true})
		purchase_finished.emit(product_id, true)
		return
	# TODO: echte Google-Play-Billing-Integration hier einhängen.

func show_rewarded_ad() -> void:
	if mock_mode:
		push_warning("Monetization: Mock-Rewarded-Ad (Ad-SDK folgt laut Roadmap).")
		Analytics.track("ad_watched", {"placement": "generic", "mock": true})
		rewarded_ad_finished.emit(true)
		return
	# TODO: echtes Rewarded-Ad-SDK hier einhängen.
`;

export const MAIN_GD = `extends Node
## Main: Boot -> MainMenu -> Gameplay -> GameOver state machine.
## UI is built in code to keep the template dependency-free; replace with
## your own scenes as the game grows.

enum State { BOOT, MENU, GAMEPLAY, GAME_OVER }

const GAMEPLAY_SCENE := "res://scenes/gameplay.tscn"

var state: State = State.BOOT
var _ui_layer: CanvasLayer
var _gameplay: Node = null
var _last_score: int = 0

func _ready() -> void:
	_ui_layer = CanvasLayer.new()
	add_child(_ui_layer)
	Analytics.track("session_start", {})
	_enter_menu()

func _enter_menu() -> void:
	state = State.MENU
	_clear_ui()
	_clear_gameplay()
	var menu := _build_menu()
	_ui_layer.add_child(menu)

func start_game() -> void:
	state = State.GAMEPLAY
	_clear_ui()
	_gameplay = load(GAMEPLAY_SCENE).instantiate()
	_gameplay.game_over.connect(_on_game_over)
	add_child(_gameplay)
	Analytics.track("run_started", {})

func _on_game_over(score: int) -> void:
	state = State.GAME_OVER
	_last_score = score
	if score > GameState.best_score:
		GameState.best_score = score
	GameState.save_game()
	Analytics.track("run_ended", {"score": score, "best": GameState.best_score})
	_clear_gameplay()
	_ui_layer.add_child(_build_game_over())

func _clear_gameplay() -> void:
	if _gameplay != null:
		_gameplay.queue_free()
		_gameplay = null

func _clear_ui() -> void:
	for child in _ui_layer.get_children():
		child.queue_free()

func _touch_button(text: String, on_pressed: Callable) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(280, 96) # touch-friendly (>= 96 px)
	button.pressed.connect(on_pressed)
	return button

func _build_menu() -> Control:
	var root := _centered_column()
	var title := Label.new()
	title.text = ProjectSettings.get_setting("application/config/name", "Spiel")
	title.add_theme_font_size_override("font_size", 42)
	root.get_node("Column").add_child(title)
	var best := Label.new()
	best.text = "Bestwert: %d   Münzen: %d" % [GameState.best_score, GameState.coins]
	root.get_node("Column").add_child(best)
	root.get_node("Column").add_child(_touch_button("Spielen", start_game))
	var sfx := _touch_button("Sound: %s" % ("an" if GameState.settings.get("sfx", true) else "aus"), Callable())
	sfx.pressed.connect(func() -> void:
		AudioManager.set_sfx_enabled(not GameState.settings.get("sfx", true))
		sfx.text = "Sound: %s" % ("an" if GameState.settings.get("sfx", true) else "aus")
	)
	root.get_node("Column").add_child(sfx)
	var privacy := _touch_button("Datenschutz", func() -> void:
		# TODO: echte Datenschutz-URL eintragen (Pflicht vor Release, siehe Checkliste).
		OS.shell_open("https://example.invalid/datenschutz")
	)
	root.get_node("Column").add_child(privacy)
	return root

func _build_game_over() -> Control:
	var root := _centered_column()
	var label := Label.new()
	label.text = "Runde vorbei!\\nPunkte: %d   Bestwert: %d" % [_last_score, GameState.best_score]
	label.add_theme_font_size_override("font_size", 32)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.get_node("Column").add_child(label)
	root.get_node("Column").add_child(_touch_button("Nochmal", start_game))
	root.get_node("Column").add_child(_touch_button("Menü", _enter_menu))
	return root

func _centered_column() -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	var column := VBoxContainer.new()
	column.name = "Column"
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.set_anchors_preset(Control.PRESET_CENTER)
	column.grow_horizontal = Control.GROW_DIRECTION_BOTH
	column.grow_vertical = Control.GROW_DIRECTION_BOTH
	column.add_theme_constant_override("separation", 24)
	root.add_child(column)
	return root
`;

export const GAMEPLAY_RUNNER_GD = `extends Node2D
## Lane-Runner gameplay: swipe left/right to switch lanes, dodge obstacles.
## Obstacles come from a small object pool (mobile performance budget).

signal game_over(score: int)

const LANES := 3
const LANE_WIDTH := 220.0
const BASE_SPEED := 420.0
const SPEED_GAIN_PER_SECOND := 6.0
const SPAWN_INTERVAL := 0.9
const POOL_SIZE := 12

var _lane := 1
var _speed := BASE_SPEED
var _distance := 0.0
var _spawn_timer := 0.0
var _running := true
var _player: Area2D
var _pool: Array[Area2D] = []
var _touch_start := Vector2.ZERO

func _ready() -> void:
	_player = _make_box(Color(0.4, 0.9, 1.0), Vector2(80, 80))
	_player.position = _lane_position(_lane, 900.0)
	add_child(_player)
	for i in POOL_SIZE:
		var obstacle := _make_box(Color(1.0, 0.45, 0.45), Vector2(90, 90))
		obstacle.visible = false
		obstacle.set_meta("active", false)
		add_child(obstacle)
		_pool.append(obstacle)

func _make_box(color: Color, size: Vector2) -> Area2D:
	var area := Area2D.new()
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	shape.shape = rect
	area.add_child(shape)
	var visual := ColorRect.new()
	visual.color = color
	visual.size = size
	visual.position = -size / 2.0
	area.add_child(visual)
	return area

func _lane_position(lane: int, y: float) -> Vector2:
	var center_x := get_viewport_rect().size.x / 2.0
	return Vector2(center_x + (lane - 1) * LANE_WIDTH, y)

func _input(event: InputEvent) -> void:
	if not _running:
		return
	if event is InputEventScreenTouch and event.pressed:
		_touch_start = event.position
	elif event is InputEventScreenTouch and not event.pressed:
		var dx := event.position.x - _touch_start.x
		if absf(dx) > 60.0:
			_switch_lane(1 if dx > 0.0 else -1)
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_LEFT:
			_switch_lane(-1)
		elif event.keycode == KEY_RIGHT:
			_switch_lane(1)

func _switch_lane(direction: int) -> void:
	_lane = clampi(_lane + direction, 0, LANES - 1)

func _process(delta: float) -> void:
	if not _running:
		return
	_speed += SPEED_GAIN_PER_SECOND * delta
	_distance += _speed * delta
	_player.position = _player.position.lerp(_lane_position(_lane, 900.0), 0.35)

	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_timer = SPAWN_INTERVAL
		_spawn_obstacle()

	for obstacle in _pool:
		if obstacle.get_meta("active"):
			obstacle.position.y += _speed * delta
			if obstacle.position.y > get_viewport_rect().size.y + 100.0:
				obstacle.set_meta("active", false)
				obstacle.visible = false
			elif obstacle.position.distance_to(_player.position) < 80.0:
				_end_run()
				return

func _spawn_obstacle() -> void:
	for obstacle in _pool:
		if not obstacle.get_meta("active"):
			obstacle.set_meta("active", true)
			obstacle.visible = true
			obstacle.position = _lane_position(randi_range(0, LANES - 1), -100.0)
			return

func _end_run() -> void:
	_running = false
	var score := int(_distance / 10.0)
	GameState.add_coins(score / 10)
	game_over.emit(score)
`;

export const GAMEPLAY_IDLE_GD = `extends Node2D
## Idle/Tycoon gameplay: tap income + generators with exponential costs +
## capped offline earnings on load.

signal game_over(score: int)

const GENERATORS := [
	{"id": "gen_1", "name": "Werkbank", "base_cost": 15, "income": 1},
	{"id": "gen_2", "name": "Schmiede", "base_cost": 120, "income": 6},
	{"id": "gen_3", "name": "Manufaktur", "base_cost": 900, "income": 28},
]
const COST_GROWTH := 1.15
const OFFLINE_CAP_HOURS := 8.0
const TAP_INCOME := 1

var _ui: VBoxContainer
var _income_accumulator := 0.0

func _ready() -> void:
	_grant_offline_earnings()
	_build_ui()
	Analytics.track("idle_session_start", {"coins": GameState.coins})

func _grant_offline_earnings() -> void:
	var away_seconds: int = mini(GameState.seconds_since_last_seen(), int(OFFLINE_CAP_HOURS * 3600.0))
	if away_seconds > 60:
		var earned := int(_income_per_second() * away_seconds * 0.5) # offline = 50% rate
		if earned > 0:
			GameState.add_coins(earned)
			Analytics.track("offline_earnings_collected", {"hours_away": away_seconds / 3600.0, "amount": earned})

func _income_per_second() -> float:
	var total := 0.0
	for generator in GENERATORS:
		total += float(generator["income"]) * float(GameState.upgrades.get(generator["id"], 0))
	return total

func _generator_cost(generator: Dictionary) -> int:
	var owned := int(GameState.upgrades.get(generator["id"], 0))
	return int(float(generator["base_cost"]) * pow(COST_GROWTH, owned))

func _process(delta: float) -> void:
	_income_accumulator += _income_per_second() * delta
	if _income_accumulator >= 1.0:
		var whole := int(_income_accumulator)
		_income_accumulator -= whole
		GameState.add_coins(whole)
		_refresh_ui()

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	_ui = VBoxContainer.new()
	_ui.set_anchors_preset(Control.PRESET_CENTER)
	_ui.add_theme_constant_override("separation", 18)
	layer.add_child(_ui)

	var tap := Button.new()
	tap.name = "TapButton"
	tap.custom_minimum_size = Vector2(320, 140)
	tap.pressed.connect(func() -> void:
		GameState.add_coins(TAP_INCOME)
		_refresh_ui()
	)
	_ui.add_child(tap)

	for generator in GENERATORS:
		var buy := Button.new()
		buy.name = "Buy_%s" % generator["id"]
		buy.custom_minimum_size = Vector2(320, 96)
		buy.pressed.connect(func() -> void:
			var cost := _generator_cost(generator)
			if GameState.spend_coins(cost):
				GameState.upgrades[generator["id"]] = int(GameState.upgrades.get(generator["id"], 0)) + 1
				Analytics.track("item_purchased", {"item_id": generator["id"], "price": cost})
				GameState.save_game()
			_refresh_ui()
		)
		_ui.add_child(buy)

	var quit := Button.new()
	quit.text = "Runde beenden"
	quit.custom_minimum_size = Vector2(320, 72)
	quit.pressed.connect(func() -> void:
		game_over.emit(GameState.coins)
	)
	_ui.add_child(quit)
	_refresh_ui()

func _refresh_ui() -> void:
	var tap: Button = _ui.get_node("TapButton")
	tap.text = "Münzen: %d\\n(+%.1f/s)  TIPPEN!" % [GameState.coins, _income_per_second()]
	for generator in GENERATORS:
		var buy: Button = _ui.get_node("Buy_%s" % generator["id"])
		var owned := int(GameState.upgrades.get(generator["id"], 0))
		buy.text = "%s (x%d) - Kosten: %d" % [generator["name"], owned, _generator_cost(generator)]
`;

export const GAMEPLAY_PUZZLE_GD = `extends Node2D
## Color-Flood puzzle: fill the board from the top-left corner within a move
## limit. Original rule set, touch-first, no external assets.

signal game_over(score: int)

const BOARD_SIZE := 8
const COLORS: Array[Color] = [
	Color(0.95, 0.45, 0.45),
	Color(0.45, 0.75, 0.95),
	Color(0.55, 0.9, 0.55),
	Color(0.95, 0.85, 0.45),
]
const MOVE_LIMIT := 22
const CELL := 96.0

var _board: Array[int] = []
var _moves := 0
var _cells: Array[ColorRect] = []
var _hud: Label

func _ready() -> void:
	randomize()
	for i in BOARD_SIZE * BOARD_SIZE:
		_board.append(randi_range(0, COLORS.size() - 1))
	_build_ui()
	_redraw()

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var origin := Vector2(40, 200)
	for y in BOARD_SIZE:
		for x in BOARD_SIZE:
			var cell := ColorRect.new()
			cell.size = Vector2(CELL - 6, CELL - 6)
			cell.position = origin + Vector2(x * CELL, y * CELL)
			layer.add_child(cell)
			_cells.append(cell)
	_hud = Label.new()
	_hud.position = Vector2(40, 100)
	_hud.add_theme_font_size_override("font_size", 30)
	layer.add_child(_hud)
	var row := HBoxContainer.new()
	row.position = Vector2(40, 200 + BOARD_SIZE * CELL + 30)
	row.add_theme_constant_override("separation", 20)
	layer.add_child(row)
	for color_index in COLORS.size():
		var button := Button.new()
		button.custom_minimum_size = Vector2(140, 96)
		button.modulate = COLORS[color_index]
		button.text = " "
		button.pressed.connect(func() -> void: _flood(color_index))
		row.add_child(button)

func _flood(new_color: int) -> void:
	var old_color := _board[0]
	if new_color == old_color:
		return
	_moves += 1
	var stack: Array[int] = [0]
	while not stack.is_empty():
		var index: int = stack.pop_back()
		if _board[index] != old_color:
			continue
		_board[index] = new_color
		var x := index % BOARD_SIZE
		var y := index / BOARD_SIZE
		if x > 0: stack.append(index - 1)
		if x < BOARD_SIZE - 1: stack.append(index + 1)
		if y > 0: stack.append(index - BOARD_SIZE)
		if y < BOARD_SIZE - 1: stack.append(index + BOARD_SIZE)
	_redraw()
	_check_end()

func _redraw() -> void:
	for i in _board.size():
		_cells[i].color = COLORS[_board[i]]
	_hud.text = "Züge: %d/%d" % [_moves, MOVE_LIMIT]

func _is_solved() -> bool:
	var first := _board[0]
	for value in _board:
		if value != first:
			return false
	return true

func _check_end() -> void:
	if _is_solved():
		var score := maxi(0, (MOVE_LIMIT - _moves) * 100 + 100)
		GameState.add_coins(score / 20)
		Analytics.track("level_completed", {"moves": _moves, "score": score})
		game_over.emit(score)
	elif _moves >= MOVE_LIMIT:
		Analytics.track("level_failed", {"moves": _moves})
		game_over.emit(0)
`;

export function mainTscn(): string {
  return `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/main.gd" id="1_main"]

[node name="Main" type="Node"]
script = ExtResource("1_main")
`;
}

export function gameplayTscn(scriptFile: string): string {
  return `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/${scriptFile}" id="1_gameplay"]

[node name="Gameplay" type="Node2D"]
script = ExtResource("1_gameplay")
`;
}
