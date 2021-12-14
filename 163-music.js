
// export const API = `https://netease-cloud-music-api-eight-lime.vercel.app`;
export const API = `https://netease-cloud-music-buh0oe6sg-song940.vercel.app`;

export const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json();
  if (data.code != 200) {
    throw new Error(data.msg);
  }
  return data;
};

export const playlist_hot = async () => {
  return request(`${API}/playlist/hot`);
};

export const playlist_top = async () => {
  const { playlists } = await request(`${API}/top/playlist`);
  return playlists;
};

export const playlist_detail = async (id) => {
  const { playlist } = await request(`${API}/playlist/detail?id=${id}`);
  return playlist;
};

export const playlist_highquality = async () => {
  const { playlists } = await request(`${API}/top/playlist/highquality`);
  return playlists;
};

export const playlist_user = async (uid) => {
  const { playlist } = await request(`${API}/user/playlist?uid=${uid}`);
  return playlist;
};

export const album_top = async () => {
  const { albums } = await request(`${API}/top/album`);
  return albums;
};

export const album_newest = async () => {
  const { albums } = await request(`${API}/album/newest`);
  return albums;
};

export const lyric = async (id) => {
  const { lrc, klyric, tlyric } = await request(`${API}/lyric?id=${id}`);
  return { lyric: lrc, klyric, tlyric };
};

export const search = async (keyword, type = 1) => {
  const { result } = await request(`${API}/search?keywords=${keyword}&type=${type}`);
  return result;
};

export const get_song_urls = async (id, quality = 'exhigh') => {
  return request(`${API}/song/url/v1?id=${id}&level=${quality}`);
};

export const get_song_url = id => {
  return `https://music.163.com/song/media/outer/url?id=${id}.mp3`
}