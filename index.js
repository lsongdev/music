import { ready } from 'https://lsong.org/scripts/dom.js';
import { serialize } from 'https://lsong.org/scripts/form.js';
import { h, render, useState, useEffect, List, ListItem } from 'https://lsong.org/scripts/react/index.js';
import { playlist_top, playlist_detail, playlist_tracks, search, get_song_url, get_song_urls, lyric } from './163-music.js';
import './player.js';

const formatDuration = duration => {
  duration = Math.floor(duration / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const Track = ({ id, track, onClick }) => {
  return h(ListItem, {
    onClick,
    className: 'track',
    leadingContent: id,
    headlineContent: track.name,
    supportingContent: (track.ar || track.artists).map(artist => artist.name).join('/') + ' - ' + (track.al || track.album).name,
    trailingContent: formatDuration(track.dt || track.duration),
  });
};

const Playlist = ({ onClick, playlist, hasMore, loadingMore, onLoadMore }) => {
  if (!playlist) return;
  return h('div', {}, [
    h('h3', null, playlist.name),
    h(List, {}, playlist.tracks.map((track, i) =>
      h(Track, { id: i + 1, track, onClick: () => onClick(track, i, playlist) }),
    )),
    hasMore && h('button', {
      className: 'load-more button',
      onClick: onLoadMore,
      disabled: loadingMore,
    }, loadingMore ? '加载中...' : '加载更多'),
  ]);
};

const Album = ({ album, onClick }) => {
  return h('div', { className: 'album', onClick: () => onClick && onClick(album) }, [
    h('img', { src: album.coverImgUrl }),
    h('h4', { className: 'album-title' }, album.name),
  ]);
};

const Albums = ({ onClick, albums }) => {
  if (!albums) return;
  return h('div', { className: 'albums' }, [
    h('h3', null, '最新专辑'),
    h('ul', {}, albums.map(album => h('li', {}, h(Album, { album, onClick })))),
  ]);
};

const Search = ({ onSearch }) => {
  const onSubmit = async e => {
    e.preventDefault();
    const { q: keyword } = serialize(e.target);
    onSearch ? onSearch(keyword) : h();
  };
  return h('form', { className: 'search', onSubmit }, [
    h('input', { type: 'text', name: 'q', placeholder: 'Search song and/or playlist, etc.' }),
  ]);
};

const App = () => {
  const [playlistId, setPlaylistId] = useState(2905047708);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [albums, setAlbums] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ offset: 0, limit: 30, hasMore: false, type: 'playlist' });
  const [miniPlayer, setMiniPlayer] = useState(null);

  useEffect(() => {
    playlist_detail(playlistId).then(playlist => {
      setPlaylist(playlist);
      setPagination({
        offset: playlist.tracks.length,
        limit: 30,
        hasMore: playlist.tracks.length < playlist.trackCount,
        type: 'playlist',
        total: playlist.trackCount
      });
    });
    playlist_top().then(setAlbums);
    setMiniPlayer(document.querySelector('mini-player'));
  }, [playlistId]);

  useEffect(() => {
    if (playlist && currentSongIndex !== -1) {
      const song = playlist.tracks[currentSongIndex];
      updateCurrentTrack(song);
    }
  }, [currentSongIndex, playlist]);

  const updateCurrentTrack = async (song) => {
    const songUrl = await get_song_url(song.id);
    const lyricData = await lyric(song.id);
    const newTrack = {
      title: song.name,
      artist: song.ar.map(artist => artist.name).join('/'),
      album: song.al.name,
      artwork: song.al.picUrl,
      src: songUrl
    };
    miniPlayer?.setTrack(newTrack);
    miniPlayer?.setLyric(lyricData.lyric.lyric);
  };

  const onSearch = keyword => {
    setKeyword(keyword);
    search(keyword, 1000).then(({ playlists }) => setAlbums(playlists));
    search(keyword, 1, pagination.limit, 0).then(({ songs: tracks, songCount }) => {
      setPlaylist({ name: '搜索结果: ' + keyword, tracks });
      setPagination({
        offset: tracks.length,
        limit: pagination.limit,
        hasMore: tracks.length < songCount,
        type: 'search',
        total: songCount
      });
    });
  };

  const prev = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const next = () => {
    if (playlist && currentSongIndex < playlist.tracks.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const onClickTrack = async (_, i) => setCurrentSongIndex(i);
  const onClickPlaylist = playlist => setPlaylistId(playlist.id);

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    try {
      const { offset, limit, type, total } = pagination;
      let newTracks = [];
      let nextTotal = total;
      if (type === 'playlist') {
        newTracks = await playlist_tracks(playlistId, limit, offset);
      } else if (type === 'search') {
        const { songs: tracks, songCount } = await search(keyword, 1, limit, offset);
        newTracks = tracks;
        nextTotal = songCount;
      }
      setPlaylist(prev => ({ ...prev, tracks: [...prev.tracks, ...newTracks] }));
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + newTracks.length,
        hasMore: prev.offset + newTracks.length < nextTotal,
        total: nextTotal
      }));
    } finally {
      setLoadingMore(false);
    }
  };

  return [
    h(Search, { onSearch }),
    h(Albums, { onClick: onClickPlaylist, albums }),
    h(Playlist, {
      onClick: onClickTrack,
      playlist,
      hasMore: pagination.hasMore,
      loadingMore,
      onLoadMore: loadMore
    }),
    h('mini-player', {
      ref: setMiniPlayer,
      onprev: prev,
      onnext: next
    })
  ];
};

ready(() => {
  const app = document.getElementById('app');
  render(h(App), app);
});