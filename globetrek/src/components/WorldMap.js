import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/highmaps';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';

const WorldMap = ({countriesToColor = []}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Highcharts.mapChart(chartRef.current, {
        chart: {
          map: worldMap,
        },
        title: {
          text: '',
        },
        series: [{
          data: countriesToColor.map(country => ({ 
            name: country, 
            value: 1
          })),
          mapData: worldMap,
          joinBy: 'name',
          name: 'Countries',
          states: {
            hover: {
              color: '#BADA55'
            }
          },
          dataLabels: {
            enabled: false,
          },
          color: '#B0B0B0',
          colorByPoint: true,
        }],
        tooltip: {
          pointFormat: '<b>{point.name}</b>',
        }
      });
    }

    return () => {};
  }, [countriesToColor]);

  return (
    <div ref={chartRef} style={{ height: '70vh', width: '100%' }} />
  );
};

export default WorldMap;