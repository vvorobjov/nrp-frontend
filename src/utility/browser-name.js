
function browserName(){
  // CHROME
  if (navigator.userAgent.indexOf('Chrome') !== -1 ) {
    return 'Chrome';
  }
  // FIREFOX
  else if (navigator.userAgent.indexOf('Firefox') !== -1 ) {
    return 'Firefox';
  }
  // INTERNET EXPLORER
  else if (navigator.userAgent.indexOf('MSIE') !== -1 ) {
    return 'Internet Explorer';
  }
  // EDGE
  else if (navigator.userAgent.indexOf('Edge') !== -1 ) {
    return 'Edge';
  }
  // SAFARI
  else if (navigator.userAgent.indexOf('Safari') !== -1 ) {
    return 'Safari';
  }
  // OPERA
  else if (navigator.userAgent.indexOf('Opera') !== -1 ) {
    return 'Opera';
  }
  // YANDEX
  else if (navigator.userAgent.indexOf('YaBrowser') !== -1 ) {
    return 'YaBrowser';
  }
  // OTHER
  else {
    return 'Other';
  }
}

export default browserName;