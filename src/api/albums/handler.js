class AlbumsHandler {
  constructor(
    albumsService,
    storageService,
    AlbumsValidator,
    UploadsValidator,
  ) {
    this.albumsService = albumsService;
    this.storageService = storageService;
    this.AlbumsValidator = AlbumsValidator;
    this.UploadsValidator = UploadsValidator;
  }

  async postAlbumHandler(request, h) {
    this.AlbumsValidator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this.albumsService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this.albumsService.getAlbumById(id);
    album.songs = await this.albumsService.getSongsByAlbumId(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this.AlbumsValidator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this.albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this.albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadAlbumCover(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this.UploadsValidator.validateAlbumCover(cover.hapi.headers);

    const fileLocation = await this.storageService.writeFile(cover, cover.hapi);
    await this.albumsService.addAlbumCoverById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.albumsService.verifyAlbum(id);
    await this.albumsService.verifyDuplicateAlbumLikes(id, credentialId);
    await this.albumsService.addAlbumLike({
      albumId: id,
      userId: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Album telah disukai!',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.albumsService.deleteAlbumLike(id, credentialId);

    return {
      status: 'success',
      message: 'Album telah batal disukai!',
    };
  }

  async getAlbumLikeHandler(request, h) {
    const { id } = request.params;

    const { isCache, likes } = await this.albumsService.getAlbumLike(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.code(200);

    if (isCache) response.header('X-Data-Source', 'cache');

    return response;
  }
}

module.exports = AlbumsHandler;
