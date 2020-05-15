import React from 'react';

type Props = {
  left: string,
  right: string,
};

export default function ({ left, right }: Props) {
  const style: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left,
    right,
  };
  return (
    <div style={style}>Canvas</div>
  );
}