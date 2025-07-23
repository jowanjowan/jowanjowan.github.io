import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const TwitchHLSPlayer = ({ domain = "jowanjowan.github.io" }) => {
  const twitchRef = useRef(null);
  const hlsRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [currentMode, setCurrentMode] = useState("twitch");
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    fetch("./channels.json")
      .then(res => res.json())
      .then(setChannels)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (channels.length > 0) createTwitchPlayer(channels[0].channel);
    return () => destroyPlayers();
  }, [channels]);

  const createTwitchPlayer = (channel) => {
    const newPlayer = new window.Twitch.Player(twitchRef.current, {
      channel,
      parent: [domain],
      autoplay: false,
      muted: true,
      controls: false
    });
    newPlayer.addEventListener(window.Twitch.Player.READY, () => {
      newPlayer.setMuted(false);
      newPlayer.play();
    });
    setPlayer(newPlayer);
  };

  const destroyPlayers = () => {
    if (player) {
      player.pause();
      setPlayer(null);
    }
    if (hlsInstance) {
      hlsInstance.destroy();
      setHlsInstance(null);
    }
    if (hlsRef.current) {
      hlsRef.current.pause();
      hlsRef.current.removeAttribute("src");
    }
  };

  const switchToTwitch = (channel) => {
    setCurrentMode("twitch");
    destroyPlayers();
    createTwitchPlayer(channel);
  };

  const switchToHLS = (url) => {
    setCurrentMode("hls");
    destroyPlayers();
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(hlsRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hlsRef.current.play();
      });
      setHlsInstance(hls);
    } else if (hlsRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      hlsRef.current.src = url;
      hlsRef.current.addEventListener('loadedmetadata', () => {
        hlsRef.current.play();
      });
    }
  };

  return (
    <div style={{ background: '#121212', color: '#fff', padding: '1rem' }}>
      <div style={{ height: '300px', backgroundColor: '#000', position: 'relative' }}>
        <div ref={twitchRef} style={{ display: currentMode === 'twitch' ? 'block' : 'none', width: '100%', height: '100%' }}></div>
        <video ref={hlsRef} controls muted style={{ display: currentMode === 'hls' ? 'block' : 'none', width: '100%', height: '100%' }} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        {channels.map((item, i) => (
          <button
            key={i}
            onClick={() => item.type === 'twitch' ? switchToTwitch(item.channel) : switchToHLS(item.url)}
            style={{ margin: '5px', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TwitchHLSPlayer;