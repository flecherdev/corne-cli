// Ejemplo completo de keymap.c con animación OLED
// Para Corne Keyboard con pantallas OLED

#include QMK_KEYBOARD_H
#include "moco-jump-32x32_oled_anim.h"

// Definición de capas
enum layers {
    _BASE = 0,
    _LOWER,
    _RAISE,
    _ADJUST
};

// Keycodes personalizados
enum custom_keycodes {
    LOWER = SAFE_RANGE,
    RAISE,
    ADJUST
};

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    /* Base Layer (QWERTY)
     * ┌─────┬─────┬─────┬─────┬─────┬─────┐                    ┌─────┬─────┬─────┬─────┬─────┬─────┐
     * │ TAB │  Q  │  W  │  E  │  R  │  T  │                    │  Y  │  U  │  I  │  O  │  P  │BKSPC│
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │CTRL │  A  │  S  │  D  │  F  │  G  │                    │  H  │  J  │  K  │  L  │  ;  │  '  │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │SHIFT│  Z  │  X  │  C  │  V  │  B  │                    │  N  │  M  │  ,  │  .  │  /  │ ESC │
     * └─────┴─────┴─────┴─────┼─────┼─────┼─────┐        ┌─────┼─────┼─────┼─────┴─────┴─────┴─────┘
     *                          │ GUI │LOWER│SPACE│        │ENTER│RAISE│ ALT │
     *                          └─────┴─────┴─────┘        └─────┴─────┴─────┘
     */
    [_BASE] = LAYOUT_split_3x6_3(
        KC_TAB,  KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,                         KC_Y,    KC_U,    KC_I,    KC_O,    KC_P,    KC_BSPC,
        KC_LCTL, KC_A,    KC_S,    KC_D,    KC_F,    KC_G,                         KC_H,    KC_J,    KC_K,    KC_L,    KC_SCLN, KC_QUOT,
        KC_LSFT, KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,                         KC_N,    KC_M,    KC_COMM, KC_DOT,  KC_SLSH, KC_ESC,
                                            KC_LGUI, LOWER,   KC_SPC,      KC_ENT,  RAISE,   KC_RALT
    ),

    /* Lower Layer
     * ┌─────┬─────┬─────┬─────┬─────┬─────┐                    ┌─────┬─────┬─────┬─────┬─────┬─────┐
     * │  `  │  1  │  2  │  3  │  4  │  5  │                    │  6  │  7  │  8  │  9  │  0  │ DEL │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │ F1  │ F2  │ F3  │ F4  │ F5  │                    │ LEFT│DOWN │ UP  │RIGHT│     │     │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │ F6  │ F7  │ F8  │ F9  │ F10 │                    │HOME │PGDN │PGUP │ END │     │     │
     * └─────┴─────┴─────┴─────┼─────┼─────┼─────┐        ┌─────┼─────┼─────┼─────┴─────┴─────┴─────┘
     *                          │     │     │     │        │     │ADJST│     │
     *                          └─────┴─────┴─────┘        └─────┴─────┴─────┘
     */
    [_LOWER] = LAYOUT_split_3x6_3(
        KC_GRV,  KC_1,    KC_2,    KC_3,    KC_4,    KC_5,                         KC_6,    KC_7,    KC_8,    KC_9,    KC_0,    KC_DEL,
        _______, KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,                        KC_LEFT, KC_DOWN, KC_UP,   KC_RGHT, _______, _______,
        _______, KC_F6,   KC_F7,   KC_F8,   KC_F9,   KC_F10,                       KC_HOME, KC_PGDN, KC_PGUP, KC_END,  _______, _______,
                                            _______, _______, _______,     _______, ADJUST,  _______
    ),

    /* Raise Layer
     * ┌─────┬─────┬─────┬─────┬─────┬─────┐                    ┌─────┬─────┬─────┬─────┬─────┬─────┐
     * │  ~  │  !  │  @  │  #  │  $  │  %  │                    │  ^  │  &  │  *  │  (  │  )  │ DEL │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │     │     │     │     │     │                    │  -  │  =  │  [  │  ]  │  \  │  `  │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │     │     │     │     │     │                    │  _  │  +  │  {  │  }  │  |  │  ~  │
     * └─────┴─────┴─────┴─────┼─────┼─────┼─────┐        ┌─────┼─────┼─────┼─────┴─────┴─────┴─────┘
     *                          │     │ADJST│     │        │     │     │     │
     *                          └─────┴─────┴─────┘        └─────┴─────┴─────┘
     */
    [_RAISE] = LAYOUT_split_3x6_3(
        KC_TILD, KC_EXLM, KC_AT,   KC_HASH, KC_DLR,  KC_PERC,                      KC_CIRC, KC_AMPR, KC_ASTR, KC_LPRN, KC_RPRN, KC_DEL,
        _______, _______, _______, _______, _______, _______,                      KC_MINS, KC_EQL,  KC_LBRC, KC_RBRC, KC_BSLS, KC_GRV,
        _______, _______, _______, _______, _______, _______,                      KC_UNDS, KC_PLUS, KC_LCBR, KC_RCBR, KC_PIPE, KC_TILD,
                                            _______, ADJUST,  _______,     _______, _______, _______
    ),

    /* Adjust Layer
     * ┌─────┬─────┬─────┬─────┬─────┬─────┐                    ┌─────┬─────┬─────┬─────┬─────┬─────┐
     * │RESET│     │     │     │     │     │                    │     │     │     │     │     │     │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │VOLUP│MUTE │BRIU │     │     │                    │     │     │     │     │     │     │
     * ├─────┼─────┼─────┼─────┼─────┼─────┤                    ├─────┼─────┼─────┼─────┼─────┼─────┤
     * │     │VOLDN│MPRV │MPLY │MNXT │BRID │                    │     │     │     │     │     │     │
     * └─────┴─────┴─────┴─────┼─────┼─────┼─────┐        ┌─────┼─────┼─────┼─────┴─────┴─────┴─────┘
     *                          │     │     │     │        │     │     │     │
     *                          └─────┴─────┴─────┘        └─────┴─────┴─────┘
     */
    [_ADJUST] = LAYOUT_split_3x6_3(
        QK_BOOT, _______, _______, _______, _______, _______,                      _______, _______, _______, _______, _______, _______,
        _______, KC_VOLU, KC_MUTE, KC_BRIU, _______, _______,                      _______, _______, _______, _______, _______, _______,
        _______, KC_VOLD, KC_MPRV, KC_MPLY, KC_MNXT, KC_BRID,                      _______, _______, _______, _______, _______, _______,
                                            _______, _______, _______,     _______, _______, _______
    )
};

// Procesamiento de teclas personalizadas
bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case LOWER:
            if (record->event.pressed) {
                layer_on(_LOWER);
                update_tri_layer(_LOWER, _RAISE, _ADJUST);
            } else {
                layer_off(_LOWER);
                update_tri_layer(_LOWER, _RAISE, _ADJUST);
            }
            return false;
        case RAISE:
            if (record->event.pressed) {
                layer_on(_RAISE);
                update_tri_layer(_LOWER, _RAISE, _ADJUST);
            } else {
                layer_off(_RAISE);
                update_tri_layer(_LOWER, _RAISE, _ADJUST);
            }
            return false;
        case ADJUST:
            if (record->event.pressed) {
                layer_on(_ADJUST);
            } else {
                layer_off(_ADJUST);
            }
            return false;
    }
    return true;
}

// ============================================================================
// CONFIGURACIÓN DE OLED CON ANIMACIÓN
// ============================================================================

#ifdef OLED_ENABLE
oled_rotation_t oled_init_user(oled_rotation_t rotation) {
    // Rotar 270 grados para orientación vertical (opcional)
    // return OLED_ROTATION_270;
    
    // O mantener horizontal
    return OLED_ROTATION_0;
}

// Variables para la animación
static uint32_t anim_timer = 0;
static uint8_t current_frame = 0;

// Función principal del OLED
bool oled_task_user(void) {
    // Actualizar animación cuando pase el tiempo del delay
    if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
        anim_timer = timer_read32();
        
        // Escribir el frame actual en el OLED
        oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
        
        // Avanzar al siguiente frame (loop infinito)
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    
    return false;
}
#endif

// ============================================================================
// VARIANTE AVANZADA: Animación solo cuando escribes
// ============================================================================
/*
#ifdef OLED_ENABLE
static uint32_t anim_timer = 0;
static uint32_t idle_timer = 0;
static uint8_t current_frame = 0;

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    if (record->event.pressed) {
        idle_timer = timer_read32(); // Resetear timer de idle
    }
    
    // ... resto del código de process_record_user ...
    return true;
}

bool oled_task_user(void) {
    // Si escribió recientemente (últimos 5 segundos)
    if (timer_elapsed32(idle_timer) < 5000) {
        // Mostrar animación
        if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
            anim_timer = timer_read32();
            oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
            current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
        }
    } else {
        // Mostrar texto estático cuando está idle
        oled_set_cursor(0, 0);
        oled_write_P(PSTR("Corne"), false);
        oled_set_cursor(0, 1);
        oled_write_P(PSTR("Keyboard"), false);
        
        // Mostrar capa actual
        oled_set_cursor(0, 3);
        switch (get_highest_layer(layer_state)) {
            case _BASE:
                oled_write_P(PSTR("BASE"), false);
                break;
            case _LOWER:
                oled_write_P(PSTR("LOWER"), false);
                break;
            case _RAISE:
                oled_write_P(PSTR("RAISE"), false);
                break;
            case _ADJUST:
                oled_write_P(PSTR("ADJUST"), false);
                break;
        }
    }
    
    return false;
}
#endif
*/
