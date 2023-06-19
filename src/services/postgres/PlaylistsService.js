const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService) {
    this.pool = new Pool();
    this.collaborationsService = collaborationsService;
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this.collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const result = await this.pool.query(
      `SELECT playlists.id, playlists.name, users.username 
      FROM playlists 
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      LEFT JOIN users ON users.id = playlists.owner
      WHERE users.id = '${owner}' OR collaborations.user_id = '${owner}'`,
    );

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addPlaylistSongById({ playlistId, songId, userId }) {
    const song = await this.pool.query(`SELECT * FROM songs where id = '${songId}'`);

    if (!song.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const id = `playlist-song-${nanoid(16)}`;
    const action = 'add';
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    await this.addPlaylistSongActivitiesById({ playlistId, songId, userId, action, time });
  }

  async addPlaylistSongActivitiesById({ playlistId, songId, userId, action, time }) {
    const id = `playlist-song-activities-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
  }

  async getPlaylistById(id, owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
      FROM playlists 
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1 AND (users.id = $2 OR collaborations.user_id = $2)`,
      values: [id, owner],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async getPlaylistSongsById(id) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer 
      FROM songs
      LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id 
      WHERE playlist_songs.playlist_id = $1`,
      values: [id],
    };
    const result = await this.pool.query(query);

    return result.rows;
  }

  async deletePlaylistSongById(id, songId) {
    const time = new Date().toISOString();
    const action = 'delete';

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [id, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }

    const userId = await this.getPlaylistSongActivitiesUserId(id);
    await this.addPlaylistSongActivitiesById({ playlistId: id, songId, userId, action, time });
  }

  async getPlaylistSongActivitiesUserId(playlistId) {
    const result = await this.pool.query(`SELECT user_id FROM playlist_song_activities WHERE playlist_id = '${playlistId}'`);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }

    return result.rows[0].user_id;
  }

  async getPlaylistSongActivitiesById(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time 
      FROM playlist_song_activities
      LEFT JOIN users ON playlist_song_activities.user_id = users.id
      LEFT JOIN songs ON playlist_song_activities.song_id = songs.id
      WHERE playlist_song_activities.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this.pool.query(query);

    return result.rows;
  }
}

module.exports = PlaylistsService;
