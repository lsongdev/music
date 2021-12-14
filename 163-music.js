
// export const API = `https://netease-cloud-music-api-eight-lime.vercel.app`;
export const API = `https://netease-cloud-music-buh0oe6sg-song940.vercel.app`;

export const playlist_hot = async () => {
  const res = await fetch(`${API}/playlist/hot`);
  const data = await res.json();
  return data;
};

export const playlist_top = async () => {
  const res = await fetch(`${API}/top/playlist`);
  const data = await res.json();
  return data.playlists;
};

export const playlist_detail = async (id) => {
  const res = await fetch(`${API}/playlist/detail?id=${id}`);
  const data = await res.json();
  return data.playlist;
};

export const playlist_highquality = async () => {
  const res = await fetch(`${API}/top/playlist/highquality`);
  const data = await res.json();
  return data.playlists;
};

export const playlist_user = async (uid) => {
  const res = await fetch(`${API}/user/playlist?uid=${uid}`);
  const data = await res.json();
  return data;
};

export const album_top = async () => {
  const res = await fetch(`${API}/top/album`);
  const data = await res.json();
  return data;
};

export const album_newest = async () => {
  const res = await fetch(`${API}/album/newest`);
  const data = await res.json();
  return data.albums;
};

export const lyric = async (id) => {
  const res = await fetch(`${API}/lyric?id=${id}`);
  const data = await res.json();
  const { lrc, klyric, tlyric } = data;
  return { lyric: lrc, klyric, tlyric };
};

export const search = async (keyword, type = 1) => {
  const res = await fetch(`${API}/search?keywords=${keyword}&type=${type}`);
  const data = await res.json();
  return data.result;
};

export const get_song_url = async id => {
  const res = await fetch(`${API}/song/url/v1?id=${id}&level=exhigh`);
  const data = await res.json();
  return data.data[0].url || get_song_url_v2(id);
};

export const get_song_url_v2 = id => {
  return `https://music.163.com/song/media/outer/url?id=${id}.mp3`
}