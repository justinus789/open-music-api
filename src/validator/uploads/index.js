const InvariantError = require('../../exceptions/InvariantError');
const { AlbumCoverSchema } = require('./schema');

const UploadsValidator = {
  validateAlbumCover: (headers) => {
    const validationResult = AlbumCoverSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;
