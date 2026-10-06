"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * Lightweight virtualization component.
 * Renders standard children if item count <= 50.
 * Beyond 50 records, windowed rendering calculates visible slice to maintain 60fps scrolling.
 */
export default function VirtualList({
  items = [],
  itemHeight = 88,
  containerHeight = 600,
  renderItem,
  threshold = 50,
  className = "",
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // If item count is within threshold, render standard map without windowing
  if (!items || items.length <= threshold) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  const totalHeight = items.length * itemHeight;
  const overscan = 5;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
      offsetTop: (startIndex + i) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`relative overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        {visibleItems.map(({ item, index, offsetTop }) => (
          <div
            key={item.id || index}
            style={{
              position: "absolute",
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
