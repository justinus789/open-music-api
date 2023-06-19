const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapSongsTableToModel } = require('../../utils/mapDBToModel');

class SongsService {
  constructor(cacheService) {
    this.pool = new Pool();
    this.cacheService = cacheService;
  }

  async addSong({ title, performer, year, genre, duration, albumId }) {
    const id = `song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    await this.cacheService.delete(`song:${id}`);
    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    const isUsingFilter = title || performer;

    const isUsingCombination = title && performer;
    const condsOperator = isUsingCombination ? 'AND' : 'OR';

    const titleUpperCase = title && title.toUpperCase();
    const performerUpperCase = performer && performer.toUpperCase();

    const queryFilter = isUsingFilter
      ? `WHERE UPPER(title) LIKE '%${titleUpperCase}%' ${condsOperator} UPPER(performer) LIKE '%${performerUpperCase}%'`
      : '';

    const result = await this.pool.query(`SELECT id, title, performer FROM songs ${queryFilter}`);

    return result.rows;
  }

  async getSongById(id) {
    try {
      const result = await this.cacheService.get(`song:${id}`);

      const data = {
        isCache: true,
        song: JSON.parse(result),
      };

      return data;
    } catch (error) {
      const query = {
        text: 'SELECT * FROM songs WHERE id = $1',
        values: [id],
      };
      const result = await this.pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Lagu tidak ditemukan');
      }

      await this.cacheService.set(
        `song:${id}`,
        JSON.stringify(result.rows.map(mapSongsTableToModel)[0]),
      );

      const data = {
        isCache: false,
        song: result.rows.map(mapSongsTableToModel)[0],
      };

      return data;
    }
  }

  async editSongById(id, { title, performer, year, genre, duration }) {
    const query = {
      text: 'UPDATE songs SET title = $1, performer = $2, year = $3, genre = $4, duration = $5 WHERE id = $6 RETURNING id',
      values: [title, performer, year, genre, duration, id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
    await this.cacheService.delete(`song:${id}`);
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
    await this.cacheService.delete(`song:${id}`);
  }
}

module.exports = SongsService;
