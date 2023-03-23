// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const autoprefixer = require('autoprefixer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tailwindcss = require('tailwindcss');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tailwindConfig = require('./tailwind.config');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const postcssPxToViewport = require('../agora-classroom-sdk/webpack/postcss-plugin/px-to-vw');
const { ENTRY } = require('./webpack/utils');
const configMap = {
  main: require('./tailwind.config'),
  classroom: require('../agora-classroom-sdk/tailwind.config'),
  onlineclass: require('../agora-onlineclass-sdk/tailwind.config'),
  proctor: require('../agora-proctor-sdk/tailwind.config'),
};
module.exports = {
  plugins: [
    autoprefixer(),
    tailwindcss(configMap[ENTRY]),
    postcssPxToViewport({
      viewportWidth: 375,
      unitPrecision: 5,
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      include: [/\/mobile\//, /\.mobile\./],
      exclude: [/\/node_modules\//],
      landscape: true, // 是否处理横屏情况
      landscapeUnit: 'vw', // (String) 横屏时使用的单位
      landscapeWidth: 812, // (Number) 横屏时使用的视口宽度
      landscapeHeight: 375, // (Number) 横屏时使用的视口宽度
    }),
  ],
};
