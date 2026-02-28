export const Dictionary = {
    'pt': {
        // UI
        'loading': 'CARREGANDO',
        'click_to_start': 'Clique para Iniciar',
        'top_pilots': 'TOP 20 PILOTOS',
        'weapon_shop': 'LOJA DE ARMAS',
        'money': 'GRANA: R$ ',
        'triple_shot': 'TIRO TRIPLO',
        'triple_shot_purchased': 'TIRO TRIPLO (COMPRADO)',
        'fire_rate': 'CADÊNCIA +',
        'fire_rate_max': 'CADÊNCIA + (MÁXIMO)',
        'extra_shield': 'ESCUDO EXTRA',
        'extra_shield_active': 'ESCUDO (ATIVO)',
        'piercing_missile': 'MÍSSIL PERFURANTE',
        'piercing_missile_purchased': 'MÍSSIL PERF. (COMPRADO)',
        'coin_magnet': 'ÍMÃ DE MOEDAS',
        'coin_magnet_active': 'ÍMÃ (ATIVO)',
        'close_shop': '[ SAIR DA LOJA ]',
        'game_over': 'GAME OVER',
        'cash': 'Grana: ',
        'enter_name': 'DIGITE O SEU NOME:',
        'btn_enter': '[ ENTER ]',
        'press_any_key': 'Pressione qualquer tecla',

        // Canvas (Game.js)
        'press_any_key_start': 'Pressione qualquer tecla!',
        'press_space_start': 'Pressione ESPAÇO para Iniciar!',
        'press_button_start': 'Aperte (A) para Iniciar!',
        'in_development': 'Em desenvolvimento...',
        'dist': 'DIST: ',
        'god_mode': 'GOD MODE',
        'paused': 'PAUSADO',

        // Currency Symbol
        'currency': 'R$ '
    },
    'en': {
        // UI
        'loading': 'LOADING',
        'click_to_start': 'Click to Start',
        'top_pilots': 'TOP 20 PILOTS',
        'weapon_shop': 'WEAPON SHOP',
        'money': 'CASH: $ ',
        'triple_shot': 'TRIPLE SHOT',
        'triple_shot_purchased': 'TRIPLE SHOT (BOUGHT)',
        'fire_rate': 'FIRE RATE +',
        'fire_rate_max': 'FIRE RATE (MAX)',
        'extra_shield': 'EXTRA SHIELD',
        'extra_shield_active': 'SHIELD (ACTIVE)',
        'piercing_missile': 'PIERCING MISSILE',
        'piercing_missile_purchased': 'PIERCING (BOUGHT)',
        'coin_magnet': 'COIN MAGNET',
        'coin_magnet_active': 'MAGNET (ACTIVE)',
        'close_shop': '[ EXIT SHOP ]',
        'game_over': 'GAME OVER',
        'cash': 'CASH: ',
        'enter_name': 'ENTER YOUR NAME:',
        'btn_enter': '[ ENTER ]',
        'press_any_key': 'Press any key',

        // Canvas (Game.js)
        'press_any_key_start': 'Press any key to start!',
        'press_space_start': 'Press SPACE to Start!',
        'press_button_start': 'Press (A) to Start!',
        'in_development': 'In development...',
        'dist': 'DIST: ',
        'god_mode': 'GOD MODE',
        'paused': 'PAUSED',

        // Currency Symbol
        'currency': 'US$ '
    }
};

let currentLanguage = 'en';

export function detectLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    if (lang && lang.toLowerCase().startsWith('pt')) {
        currentLanguage = 'pt';
    } else {
        currentLanguage = 'en';
    }
    //currentLanguage = 'en'; //força o idioma para fins de testes.
}

export function t(key) {
    if (Dictionary[currentLanguage] && Dictionary[currentLanguage][key]) {
        return Dictionary[currentLanguage][key];
    }
    return key; // Fallback to key itself if missing
}

export function getCurrentLanguage() {
    return currentLanguage;
}
