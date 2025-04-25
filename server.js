const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let state = {
    power: 1,
    brightness: 1,
    audio: {
        volume: 70,
        muted: 0
    }
} ;

function getRealState() {
    exec('blight get', (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to get brightness:', stderr) ;
            return 0 ;
        }
        const brightness = parseInt(stdout.trim()) ;
        if (brightness === 20000) {
            state.brightness = 1 ;
        } else {
            state.brightness = 0 ;
        }
        return 1 ;
    });

    exec("pactl -- get-sink-volume 0 | tr ' ' '\n' | grep '%' | tail -1 | tr -d '%'",
        (error, stdout, stderr) => {
            if (error) {
                console.error('Failed to get audio volume:', stderr) ;
                return 0 ;
            }
        const volume = parseInt(stdout.trim()) ;
        state.audio.volume = volume ;
        return 1 ;
    }) ;

    exec("pactl -- get-sink-mute 0 | cut -d ' ' -f2", (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to get mute state', stderr) ;
            return 0 ;
        }
        const mute = stdout ;
        if(mute.includes("yes")) {
            state.audio.muted = 1 ;
        } else {
            state.audio.muted = 0 ;
        }
        return 1 ;
    }) ;
}
getRealState() ;

function audio_mgr(command){
    switch(command) {
        case 1:
            exec("pactl -- set-sink-mute 0 toggle", (error, stdout, stderr) => {
                if(error) {
                    console.error('Failed to set mute volume', stderr) ;
                    return 0 ;
                }
            }) ;
            break ;
        case 2:
            exec("pactl -- set-sink-volume 0 +5%", (error, stdout, stderr) => {
                if(error) {
                    console.error('Failed to set volume', stderr) ;
                    return 0 ;
                }
            }) ;
            break ;
        case 3:
            exec("pactl -- set-sink-volume 0 -5%", (error, stdout, stderr) => {
                if(error) {
                    console.error('Failed to set volume', stderr) ;
                    return 0 ;
                }
            }) ;
            break ;
        default:
            break ;
    }
    return 1 ;
}

function powerOff() {
    exec("shutdown 0", (error, stdout, stderr) => {
        if(error) {
            console.error('Failed to shutdown lmao', stderr) ;
            return 0 ;
        }
    }) ;
}
function bright_mgr(command){
    switch(command){
        case 1:
            exec("blight set 20000", (error, stdout, stderr) => {
                if(error) {
                    console.error('Failed to set brightness', stderr) ;
                    return 0 ;
                }
            }) ;
            break ;
        case 2:
            exec("blight set 2000", (error, stdout, stderr) => {
                if(error) {
                    console.error('Failed to set brightness', stderr) ;
                    return 0 ;
                }
            }) ;
            break ;
    }
}
// Get current power value
app.get('/data', (req, res) => {
    getRealState() ;
    res.json(state);
});

app.post('/power/off', (req, res) => {
    powerOff() ;
    res.json({ power: state.power });
});

app.post('/brightness/max', (req, res) => {
    bright_mgr(1) ;
    res.json({ brightness: state.brightness}) ;
}) ;

app.post('/brightness/min', (req, res) => {
    bright_mgr(2) ;
    res.json({ brightness: state.brightness}) ;
}) ;

app.post('/audio/mute', (req, res) => {
    audio_mgr(1) ;
    res.json({ muted: state.audio.muted }) ;
}) ;

app.post('/audio/up', (req, res) => {
    audio_mgr(2) ;
    res.json({volume: state.audio.volume}) ;
}) ;

app.post('/audio/down', (req, res) => {
    audio_mgr(3) ;
    res.json({volume: state.audio.volume}) ;
}) ;

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

