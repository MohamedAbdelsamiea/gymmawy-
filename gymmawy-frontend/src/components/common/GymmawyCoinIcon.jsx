import React from 'react';

const GymmawyCoinIcon = ({ className = '', size = 16, ...props }) => {
  return (
    <img
      src="/assets/common/gymmawy-coin.png"
      alt="Gymmawy Coin"
      className={className}
      style={{
        width: size,
        height: 'auto',
        objectFit: 'contain'
      }}
      {...props}
    />
  );
};

export default GymmawyCoinIcon;
