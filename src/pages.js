import app from './index.js';
export default {
  fetch(request, env) {
    // Pages serves clean HTML URLs; leave that normalization to its asset binding.
    return app.fetch(request, { ...env, PLATFORM: 'pages' });
  },
};
