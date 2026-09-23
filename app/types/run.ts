export interface Run {
    acts:                string[];
    ascension:           number;
    build_id:            string;
    game_mode:           string;
    killed_by_encounter: string;
    killed_by_event:     string;
    map_point_history:   Array<MapPointHistory[]>;
    modifiers:           unknown[];
    platform_type:       string;
    players:             Player[];
    run_time:            number;
    schema_version:      number;
    seed:                string;
    start_time:          number;
    was_abandoned:       boolean;
    win:                 boolean;
}

export interface MapPointHistory {
    map_point_type: string;
    player_stats:   PlayerStat[];
    rooms:          Room[];
}

export interface PlayerStat {
    ancient_choice?:    AncientChoice[];
    current_gold:       number;
    current_hp:         number;
    damage_taken:       number;
    event_choices?:     EventChoice[];
    gold_gained:        number;
    gold_lost:          number;
    gold_spent:         number;
    gold_stolen:        number;
    hp_healed:          number;
    max_hp:             number;
    max_hp_gained:      number;
    max_hp_lost:        number;
    player_id:          number;
    relic_choices?:     Choice[];
    stolen_loot:        number;
    card_choices?:      CardChoice[];
    cards_gained?:      Deck[];
    potion_choices?:    Choice[];
    rest_site_choices?: string[];
    upgraded_cards?:    string[];
    bought_colorless?:  string[];
    relics_removed?:    string[];
    potion_used?:       string[];
    cards_enchanted?:   CardsEnchanted[];
    bought_relics?:     string[];
    cards_removed?:     CardsRemoved[];
    potion_discarded?:  string[];
}

export interface AncientChoice {
    TextKey:    string;
    title:      Title;
    was_chosen: boolean;
}

export interface Title {
    key:   string;
    table: Table;
}

export type Table = "relics" | "events";

export interface CardChoice {
    card:       Deck;
    was_picked: boolean;
}

export interface Deck {
    floor_added_to_deck?:   number;
    id:                     string;
    current_upgrade_level?: number;
    enchantment?:           Enchantment;
}

export interface Enchantment {
    amount: number;
    id:     string;
}

export interface CardsEnchanted {
    card:        Card;
    enchantment: string;
}

export interface Card {
    enchantment:         Enchantment;
    floor_added_to_deck: number;
    id:                  string;
}

export interface CardsRemoved {
    floor_added_to_deck: number;
    id:                  string;
}

export interface EventChoice {
    title:      Title;
    variables?: { [key: string]: Variable };
}

export interface Variable {
    type:          Type;
    decimal_value: number;
    bool_value:    boolean;
    string_value:  null | string;
}

export type Type = "DynamicString" | "BaseDynamic";

export interface Choice {
    choice:     string;
    was_picked: boolean;
}

export interface Room {
    model_id?:    string;
    room_type:    string;
    turns_taken:  number;
    monster_ids?: string[];
}

export interface Player {
    badges:                Badge[];
    character:             string;
    deck:                  Deck[];
    id:                    number;
    max_potion_slot_count: number;
    potions:               Potion[];
    relics:                Relic[];
}

export interface Badge {
    id:     string;
    rarity: string;
}

export interface Potion {
    id:         string;
    slot_index: number;
}

export interface Relic {
    floor_added_to_deck: number;
    id:                  string;
    props?:              Props;
}

export interface Props {
    bools?:     Bool[];
    ints?:      Int[];
    model_ids?: ModelID[];
}

export interface Bool {
    name:  string;
    value: boolean;
}

export interface Int {
    name:  string;
    value: number;
}

export interface ModelID {
    name:  string;
    value: string;
}
