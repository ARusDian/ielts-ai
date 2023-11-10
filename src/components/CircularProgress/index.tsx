import React from "react";

import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'
interface Props {
    value : number
}

export default function CircularProgress({ value }: Props) {
    

    const getColor = (value:number) : string => {
        if(value <= 50) {
            return "rgb(185 28 28);"
        } else if (value <= 75) {
            return "rgb(250 204 21)";
        } else if (value <= 100) {
            return "rgb(21 128 61)";
        } else {
            return "rgb(0,0,0)";
        }
    
    }


    return (
        <div style={{ width: 100, height: 100 }}>
            <CircularProgressbar
                background={true}
                styles={{ path: { stroke: getColor(value) }, background: { fill: "white" }, text: { fill: getColor(value)  } }}
                value={value ?? 0}
                text={value.toString() + "%"} />
        </div>
    )
}

