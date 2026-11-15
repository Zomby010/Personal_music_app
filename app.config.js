// Reads app.json and, for development builds only, adjusts it.
//
// APP_VARIANT=development produces "My Music Dev": a separate app (its own
// package id, so it installs next to the release app) that is allowed to reach
// the network, because it loads its JavaScript from the dev server on your PC.
// Release builds are unchanged and stay fully offline.
const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => {
  if (!IS_DEV) {
    return config;
  }

  return {
    ...config,
    name: `${config.name} Dev`,
    android: {
      ...config.android,
      package: `${config.android.package}.dev`,
      blockedPermissions: config.android.blockedPermissions.filter(
        (permission) => permission !== 'android.permission.INTERNET',
      ),
    },
  };
};
