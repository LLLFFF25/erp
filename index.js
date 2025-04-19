const emotes = {
    14: 'fund me', // money beg special emote

    16: 'hi',
    17: 'bow',
    18: 'sad',
    19: 'happy',
    20: 'victory',
    21: 'dance',
    22: 'taunt',
    23: 'clap',
    24: 'beg',
    25: 'think',
    26: 'love',
    27: 'attack',
    28: 'point',
    29: 'shy',
    30: 'mad',

    38: 'sit',
    39: 'stand up', // /stand !!!
    51: 'settle',
}

const idle_animations = {
    31: 'idle sway',
    32: 'idle hop skip / hands on face',
    33: 'idle (^o^) bug catch',
}

const random_interactions = {
    34: 'Talking with NPC v.1',
    35: 'Talking with NPC v.2',
    36: 'Talking with NPC v.3',
}

const item_animations = {
    11: 'crafting potions', // doesn't work
    12: 'crafting weapons', // doesn't work
    13: 'sewing', // doesn't work
    37: 'using tp scroll',
}

// Some emotes in the 40s seem to be some sort of mounted animation,
// probably used somewhere in the story quests

// Module to do the following:
// 1: Match emotes with the person you choose | "erp partner <name>"
// 3: Force emotes on demand | "erp emote <id>"

module.exports = function erp(mod){
    mod.game.initialize("me");

    let enabled = true;
    let partnerGameId = null;
    let partnerName = null;

    mod.command.add('erp', (cmd, x) => {
        if(!cmd) {
            enabled = !enabled;
            mod.command.message(`erp ${enabled ? 'enabled' : 'disabled'}`);
            return;
        }
        switch(cmd) {
            case 'emote':
                if(!x || x.length < 1 || isNaN(x)) {
                    mod.command.message('Please specify an emote id.');
                    return;
                }
                x = parseInt(x);
                mod.send('C_SOCIAL', 1, {emote: x,});
                break;
            case 'partner':
                if(!x || x.length < 1) {
                    partnerGameId = null;
                    partnerName = null;
                    mod.command.message('Partner cleared.');
                    return;
                } else{ // TODO some checks for valid name
                    setPartner(x);
                }
                break;
            default:
                mod.command.message(`Unknown command ${cmd}`);
                break;
        }
    });

    mod.hook('S_SOCIAL', 1, (event) => {
        if(!enabled) return;
        if( !mod.game.me.alive || // mod.game.me.inDungeon ||
            mod.game.me.inCombat || mod.game.me.inBattleGround ||
            mod.game.me.inCivilUnrest || mod.game.me.mounted|| 
            mod.game.me.onPegasus) return;
        if(event.target !== partnerGameId) return;

        // If the emote is in emotes, or idle_animations -> play it
        if(emotes[event.animation] || idle_animations[event.animation]) {
            mod.send('C_SOCIAL', 1, {emote: event.animation});
        }

    });


    // Hooks once on inspects to get partner's game id
    function setPartner(name) {
        mod.hookOnce('S_USER_PAPERDOLL_INFO', 11, (event) => {
            partnerGameId = event.gameId;
            partnerName = event.name;
            mod.command.message(`Partner set to ${partnerName}`);
        });
        
        mod.send('C_REQUEST_USER_PAPERDOLL_INFO', 3, {
            name: name,
            zoom: false
        });

    }

    // If packet isn't fake, and there is a partner set, and the emote is an idle animation:
    // Prevent sending the idle animation packet
    // TODO: still not working properly
    mod.hook('C_SOCIAL', 1, { filter: { fake: false } }, (event) => {
        if(!enabled) return;
        if(partnerName != null || partnerGameId == null){
            if(Number(event.emote) === 31 || Number(event.emote) === 32 || Number(event.emote) === 33) {
                //mod.log('Prevented animation: ', emotes[event.emote]);
                return false; // Prevents sending the idle animation packet
            }     
        }            
    });
}