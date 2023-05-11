const convertHexColortoNumber = (hexString: `#${string}`) => {
  return parseInt(hexString.replace("#", ""), 16);
};

export default convertHexColortoNumber;
