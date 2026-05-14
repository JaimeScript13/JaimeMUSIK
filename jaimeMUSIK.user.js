// ==UserScript==
// @name         JaimeMUSIK Player (With Custom Picture Toggle)
// @namespace    tampermonkey.net
// @version      9.0
// @description  Bypasses security blocks with skip controls, live timeline bar, high-contrast lyrics panels, and a custom image thumbnail toggle button
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      files.catbox.moe
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    if (window.self !== window.top) return;

    // ==========================================
    // CUSTOM VISUAL PICTURE CONFIGURATION
    // CHANGE THE URL LINK BELOW TO WHATEVER PICTURE YOU WANT THE LOGO TO BE
    // ==========================================
    const iconUrl = "https://media.tenor.com/jUpw4Wv5UboAAAAM/hi.gif";

    // Playlist array data management
    const playlist = [
        {
            title: "I Fall Apart",
            url: "https://files.catbox.moe/ojzyga.mp3",
            lyrics: `
                <div style="color: #ffffff; font-weight: 900; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #ffffff; padding-bottom: 2px;">I Fall Apart</div>
                <div>Ooh, I fall apart</div><div>Ooh, yeah</div><div>Hmm-hmm, yeah</div><div>She told me that I'm not enough (Sub-)</div><div>And she left me with a broken heart (Sub-)</div><div>She fooled me twice, and it's all my fault (Sub-)</div><div>She cut too deep, now she left me scarred (Sub-)</div><div>Now there's so many thoughts goin' through my brain (Sub-)</div><div>And now I'm takin' these shots like it's Novocaine, yeah</div><br><div>Ooh, I fall apart, down to my core</div><div>Ooh, I fall apart, down to my core</div>
            `
        },
        {
            title: "rockstar (ft. 21 Savage)",
            url: "https://files.catbox.moe/gvh57x.mp3",
            lyrics: `
                <div style="color: #ffffff; font-weight: 900; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #ffffff; padding-bottom: 2px;">rockstar</div>
                <div>Thank God</div><div>Ay</div><div>I've been fuckin' hos and poppin' pillies, man, I feel just like a rockstar (ay, ay)</div>
            `
        },
        {
            title: "Butterfly - Black Oxygen",
            url: "https://files.catbox.moe/uxbivj.mp3",
            lyrics: `
                <div style="color: #ffffff; font-weight: 900; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #ffffff; padding-bottom: 2px;">Butterfly</div>
                <div>[Instrumental Playback]</div><div>Lyrics text lines for Butterfly go here...</div>
            `
        },
        {
            title: "Troubadour of Troubled Souls",
            url: "https://files.catbox.moe/nc1rie.mp3",
            lyrics: `
                <div style="color: #ffffff; font-weight: 900; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px dashed #ffffff; padding-bottom: 2px;">Troubadour of Troubled Souls</div>
                <div>Troubadour of troubled souls</div><div>Where I'm going, nobody knows</div><div>Ain't got no line, can't see no road</div>
            `
        }
    ];

    let currentTrackIndex = 0;

    // 1. Create the persistent floating thumbnail logo picture
    const toggleIcon = document.createElement('div');
    toggleIcon.id = 'jaime-musik-toggle-logo';
    toggleIcon.style.position = 'fixed';
    toggleIcon.style.top = '20px';
    toggleIcon.style.right = '20px';
    toggleIcon.style.zIndex = '999999';
    toggleIcon.style.width = '45px';
    toggleIcon.style.height = '45px';
    toggleIcon.style.borderRadius = '50%';
    toggleIcon.style.backgroundImage = `url('${iconUrl}')`;
    toggleIcon.style.backgroundSize = 'cover';
    toggleIcon.style.backgroundPosition = 'center';
    toggleIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toggleIcon.style.cursor = 'pointer';
    toggleIcon.style.border = '2px solid #a6e3a1';
    toggleIcon.style.display = 'none'; // Starts hidden while the full player is open
    toggleIcon.title = "Click to open JaimeMUSIK";

    // 2. Create and style the main player framework container box
    const playerContainer = document.createElement('div');
    playerContainer.id = 'jaime-musik-container';
    playerContainer.style.position = 'fixed';
    playerContainer.style.top = '20px';
    playerContainer.style.right = '20px';
    playerContainer.style.zIndex = '999998';
    playerContainer.style.backgroundColor = '#1e1e2e';
    playerContainer.style.color = '#cdd6f4';
    playerContainer.style.padding = '14px 18px';
    playerContainer.style.borderRadius = '12px';
    playerContainer.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    playerContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    playerContainer.style.display = 'flex';
    playerContainer.style.flexDirection = 'column';
    playerContainer.style.gap = '10px';
    playerContainer.style.width = '260px';
    playerContainer.style.userSelect = 'none';

    playerContainer.innerHTML = `
        <div style="font-weight: bold; font-size: 14px; border-bottom: 1px solid #45475a; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span>🎵 JaimeMUSIK <span style="font-size: 9px; font-weight: normal; color: #a6adc8;">[H to Collapse]</span></span>
            <span id="jaime-status" style="font-size: 10px; color: #fab387;">Loading...</span>
        </div>
        <select id="jaime-playlist-select" style="width: 100%; background-color: #11111b; color: #cdd6f4; border: 1px solid #313244; padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer; outline: none;"></select>
        <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between;">
            <button id="jaime-back-btn" disabled style="background: #585b70; color: #a6adc8; border: none; padding: 6px 10px; border-radius: 6px; cursor: not-allowed; font-weight: bold; font-size: 11px;">-10s</button>
            <button id="jaime-play-btn" disabled style="background: #585b70; color: #a6adc8; border: none; padding: 6px 14px; border-radius: 6px; cursor: not-allowed; font-weight: bold; flex-grow: 1; font-size: 13px;">Wait</button>
            <button id="jaime-fwd-btn" disabled style="background: #585b70; color: #a6adc8; border: none; padding: 6px 10px; border-radius: 6px; cursor: not-allowed; font-weight: bold; font-size: 11px;">+10s</button>
            <input type="range" id="jaime-volume" min="0" max="1" step="0.1" value="0.5" style="width: 50px; cursor: pointer;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
            <input type="range" id="jaime-timeline" min="0" max="100" value="0" disabled style="width: 100%; cursor: not-allowed; margin: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a6adc8; padding: 0 2px;">
                <span id="jaime-time-current">0:00</span>
                <span id="jaime-time-total">0:00</span>
            </div>
        </div>
        <div id="jaime-lyrics-box" style="background-color: #000000; border-radius: 8px; padding: 12px; height: 110px; overflow-y: auto; font-size: 12px; line-height: 1.8; color: #ffffff; text-align: center; border: 2px solid #ffffff; font-weight: 500;"></div>
    `;

    document.body.appendChild(playerContainer);
    document.body.appendChild(toggleIcon);

    // [Operational script control variables and layout hooks remain unchanged]
    const playButton = document.getElementById('jaime-play-btn');
    const backButton = document.getElementById('jaime-back-btn');
    const fwdButton = document.getElementById('jaime-fwd-btn');
    const volumeSlider = document.getElementById('jaime-volume');
    const timelineSlider = document.getElementById('jaime-timeline');
    const timeCurrentLabel = document.getElementById('jaime-time-current');
    const timeTotalLabel = document.getElementById('jaime-time-total');
    const statusLabel = document.getElementById('jaime-status');
    const lyricsBox = document.getElementById('jaime-lyrics-box');
    const trackSelector = document.getElementById('jaime-playlist-select');

    playlist.forEach((track, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.innerText = track.title;
        trackSelector.appendChild(option);
    });

    let audioCtx = null, decodedBuffer = null, sourceNode = null, gainNode = null, isPlaying = false, startTime = 0, pausedAt = 0, currentVolume = 0.5, timelineUpdateInterval = null;

    function formatClockTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ":" + (secs < 10 ? "0" : "") + secs;
    }

    function loadTrack(index) {
        stopPlayback();
        decodedBuffer = null; pausedAt = 0; timelineSlider.value = 0;
        timeCurrentLabel.innerText = "0:00"; timeTotalLabel.innerText = "0:00";
        statusLabel.innerText = "Loading..."; statusLabel.style.color = "#fab387";
        playButton.innerText = "Wait"; playButton.style.background = "#585b70";
        playButton.style.color = "#a6adc8"; playButton.style.cursor = "not-allowed";
        playButton.setAttribute("disabled", "true");
        lyricsBox.innerHTML = playlist[index].lyrics; lyricsBox.scrollTop = 0;
        GM_xmlhttpRequest({
            method: "GET",
            url: playlist[index].url,
            responseType: "arraybuffer",
            onload: function(response) {
                if (response.status === 200) {
                    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    audioCtx.decodeAudioData(response.response, function(buffer) {
                        decodedBuffer = buffer;
                        statusLabel.innerText = "Ready"; statusLabel.style.color = "#a6e3a1";
                        playButton.innerText = "Play"; playButton.style.background = "#a6e3a1";
                        playButton.style.color = "#11111b"; playButton.style.cursor = "pointer";
                        playButton.removeAttribute("disabled");
                        backButton.style.background = "#89b4fa"; backButton.style.color = "#11111b";
                        backButton.style.cursor = "pointer"; backButton.removeAttribute("disabled");
                        fwdButton.style.background = "#89b4fa"; fwdButton.style.color = "#11111b";
                        fwdButton.style.cursor = "pointer"; fwdButton.removeAttribute("disabled");
                        timelineSlider.removeAttribute("disabled");
                        timelineSlider.style.cursor = "pointer";
                        timelineSlider.max = Math.floor(decodedBuffer.duration);
                        timeTotalLabel.innerText = formatClockTime(decodedBuffer.duration);
                    });
                } else {
                    statusLabel.innerText = "Net Error"; statusLabel.style.color = "#f38ba8";
                }
            }
        });
    }

    function startPlayback() {
        if (!audioCtx || !decodedBuffer) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);
        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = decodedBuffer;
        sourceNode.connect(gainNode);
        sourceNode.loop = true;
        let playPosition = pausedAt % decodedBuffer.duration;
        if (playPosition < 0) playPosition += decodedBuffer.duration;
        startTime = audioCtx.currentTime - playPosition;
        sourceNode.start(0, playPosition);
        isPlaying = true;
        playButton.innerText = 'Pause'; playButton.style.backgroundColor = '#f38ba8';
        startTimelineTicker();
    }

    // [Core controller mechanisms remain unchanged]
    function stopPlayback() {
        stopTimelineTicker();
        if (sourceNode) {
            try { sourceNode.stop(); } catch(e) {}
            sourceNode.disconnect();
        }
        if (audioCtx && isPlaying) pausedAt = audioCtx.currentTime - startTime;
        isPlaying = false;
        playButton.innerText = 'Play'; playButton.style.backgroundColor = '#a6e3a1';
    }

    function startTimelineTicker() {
        timelineUpdateInterval = setInterval(() => {
            if (!isPlaying || !decodedBuffer) return;
            const livePosition = (audioCtx.currentTime - startTime) % decodedBuffer.duration;
            timelineSlider.value = Math.floor(livePosition);
            timeCurrentLabel.innerText = formatClockTime(livePosition);
        }, 250);
    }

    function stopTimelineTicker() {
        if (timelineUpdateInterval) clearInterval(timelineUpdateInterval);
    }

    // Visibility toggle handler logic function
    function toggleVisibility() {
        if (playerContainer.style.display === 'none') {
            playerContainer.style.display = 'flex';
            toggleIcon.style.display = 'none';
        } else {
            playerContainer.style.display = 'none';
            toggleIcon.style.display = 'block';
        }
    }

    loadTrack(currentTrackIndex);
    trackSelector.addEventListener('change', (e) => {
        currentTrackIndex = parseInt(e.target.value);
        loadTrack(currentTrackIndex);
    });
    playButton.addEventListener('click', () => isPlaying ? stopPlayback() : startPlayback());
    timelineSlider.addEventListener('input', (e) => {
        if (!decodedBuffer) return;
        const pos = parseFloat(e.target.value);
        timeCurrentLabel.innerText = formatClockTime(pos);
        if (isPlaying) { stopPlayback(); pausedAt = pos; startPlayback(); } else pausedAt = pos;
    });
    backButton.addEventListener('click', () => {
        if (!decodedBuffer) return;
        let pos = (isPlaying ? (audioCtx.currentTime - startTime) : pausedAt) - 10;
        if (pos < 0) pos = 0;
        timelineSlider.value = Math.floor(pos); timeCurrentLabel.innerText = formatClockTime(pos);
        if (isPlaying) { stopPlayback(); pausedAt = pos; startPlayback(); } else pausedAt = pos;
    });
    fwdButton.addEventListener('click', () => {
        if (!decodedBuffer) return;
        let pos = (isPlaying ? (audioCtx.currentTime - startTime) : pausedAt) + 10;
        if (pos > decodedBuffer.duration) pos = decodedBuffer.duration;
        timelineSlider.value = Math.floor(pos); timeCurrentLabel.innerText = formatClockTime(pos);
        if (isPlaying) { stopPlayback(); pausedAt = pos; startPlayback(); } else pausedAt = pos;
    });
    volumeSlider.addEventListener('input', (e) => {
        currentVolume = parseFloat(e.target.value);
        if (gainNode && audioCtx) gainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    });

    // Handle clicks directly on the floating custom icon image
    toggleIcon.addEventListener('click', toggleVisibility);

    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (e.key === 'h' || e.key === 'H') {
            toggleVisibility();
        }
    });
})();
