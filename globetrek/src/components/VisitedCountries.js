import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';

const VisitedCountriesChart = ({countries = []}) => {
    const numberOfCountries = worldMap.features.length;

    const data = {
        data: [
            { id: 'Visited', value: (countries.length / numberOfCountries * 100).toFixed(2), label: 'Visited' },
            { id: 'NotVisited', value: ((1-(countries.length/numberOfCountries))*100).toFixed(2), label: 'NotVisited' },
        ],
    };

    return (
        <div style={{ height: '35vh', width: '25vw', paddingRight: '1vw' }}>
            <PieChart
            colors={['#959ffc', '#beefef']}
                series={[
                    {
                        type: 'pie',
                        arcLabel: (item) => `${item.value}%`,
                        innerRadius: '40%',
                        outerRadius: '90%',
                        paddingAngle: 5,
                        cornerRadius: 5,
                        data: data.data,
                    },
                ]}
                legend={{ hidden: true }}
            />
        </div>
    );
};

export default VisitedCountriesChart;