
// 模拟 he.decode 函数
const he = {
  decode: (str) => {
    if (!str) return '';
    // 简化的 HTML 实体解码实现
    return str.replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  }
};

// 模拟 formatPlayTime 函数
const formatPlayTime = (time) => {
  if (!time) return '';
  let m = Math.trunc(time / 60);
  let s = Math.trunc(time % 60);
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
};

// 模拟 formatSinger 函数
const formatSinger = (rawData) => rawData.replace(/&/g, '、');

// 模拟 decodeName 函数
const decodeName = (str = '') => {
  if (!str) return '';
  return he.decode(str);
};

// handleResult 函数主体
const handleResult = (rawData) => {
  const result = [];
  if (!rawData) return result;

  const regExps = {
    mInfo: /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/,
  };

  for (let i = 0; i < rawData.length; i++) {
    const info = rawData[i];
    let songId = info.MUSICRID.replace('MUSIC_', '');

    if (!info.N_MINFO) {
      console.log('N_MINFO is undefined');
      return null;
    }

    const types = [];
    const _types = {};

    let infoArr = info.N_MINFO.split(';');
    for (let infoStr of infoArr) {
      let match = infoStr.match(regExps.mInfo);
      if (match) {
        switch (match[2]) {
          case '20900':
            types.push({ type: 'master', size: match[4] });
            _types.master = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '20501':
            types.push({ type: 'atmos_plus', size: match[4] });
            _types.atmos_plus = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '20201':
            types.push({ type: 'atmos', size: match[4] });
            _types.atmos = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '4000':
            types.push({ type: 'hires', size: match[4] });
            _types.hires = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '2000':
            types.push({ type: 'flac', size: match[4] });
            _types.flac = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '320':
            types.push({ type: '320k', size: match[4] });
            _types['320k'] = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
          case '128':
            types.push({ type: '128k', size: match[4] });
            _types['128k'] = {
              size: match[4].toLocaleUpperCase(),
            };
            break;
        }
      }
    }
    types.reverse();

    let interval = parseInt(info.DURATION);

    result.push({
      name: decodeName(info.SONGNAME),
      singer: formatSinger(decodeName(info.ARTIST)),
      source: 'kw',
      songmid: songId,
      albumId: decodeName(info.ALBUMID || ''),
      interval: Number.isNaN(interval) ? 0 : formatPlayTime(interval),
      albumName: info.ALBUM ? decodeName(info.ALBUM) : '',
      lrc: null,
      img: null,
      otherSource: null,
      types,
      _types,
      typeUrl: {},
    });
  }

  return result;
};

// 写死文件路径
const INPUT_FILE_PATH = './searchResult.json';

// 直接运行处理逻辑
const fs = require('fs');

try {
  // 读取输入文件
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE_PATH, 'utf8'));

  // 处理数据
  const result = handleResult(rawData);

  // 输出结果
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('处理文件时出错:', error.message);
  process.exit(1);
}

// 导出函数供其他模块使用
module.exports = handleResult;
