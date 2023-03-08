import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { styled } from '@mui/material/styles';
import { TextField, Typography } from "@mui/material";
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

async function NeighborSearch(molecule_id, type, components, limit=48, skip=0) {
    let encoded = encodeURIComponent(components);

    const response =  await fetch(`/api/molecules/${molecule_id}/neighbors/?type=${type}&components=${encoded}&skip=${skip}&limit=${limit}`)

    if (!response.ok) {
        throw new Error('Invalid Molecule Id')
    }

    else {
        return await response.json()
    }
}

export default function NeighborSearchHook () {

    const interval = 15;

    const [ moleculeid, setSearch ] = useState(1);
    const [ type, setType ] = useState("pca");
    const [ components, setComponents ] = useState("1,2,3,4");
    const [ skip, setSkip ] = useState(0);
    const [ results, setResults ] = useState([]);
    const [ validMolecule, setValidMolecule ] = useState(true);
    const [ svg_results, setSVGResults ] = useState([])
    const [ searchPage, setSearchPage ] = useState(1);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ searchToggle, setSearchToggle ] = useState(true);
    const [ isLoadingMore, setIsLoadingMore ] = useState(false);
    const [ molData, setMolData] = useState([]);

    // Plotting functions to show molecules on hover
    function showSVGWindow(svg, event) {

        // remove in case existing
        if (document.getElementById("molecule")) {
          document.getElementById("molecule").remove()
        }
      
        let mol = document.createElement("g")
        mol.setAttribute("id", "molecule")
        
        let plotly_container = document.getElementsByClassName("plotly")
        mol.innerHTML = svg;
        
        let xpos = event.event.clientX - 160;
        let ypos = event.event.clientY - 160;
      
        plotly_container[0].appendChild(mol);
        mol.style.position = "absolute";
        mol.style.left = `${xpos}px`;
        mol.style.top = `${ypos}px`;
      
    }
      
    function showSVG(event) {
    fetch(`depict/cow/svg?smi=${event.points[0].text}&w=40&h=40`).then(response => 
        response.text() ).then( body => showSVGWindow(body, event) );
    }
    
    function hideSVG(event) {
    if (document.getElementById("molecule")) {
        document.getElementById("molecule").remove()
    }
    
    }
    // Returns the components entered as an array of strings
    function getComponents(components){
        return components.split(",");
    }

    function Graph(){
        // Getting the components to label the axis.
        let componentArray = getComponents(components);
        // Shifting the data by 1, to avoid overwriting the target of the search
        let neighbors = molData.slice(1);
        let myPlot = <Plot onHover={ (event) => showSVG(event) } 
        onUnhover={ (event)=> hideSVG(event) } 
        style={{'width': '100%', 'height': '100%' }}
        useResizeHandler={true}
        data={[
            // Creating the data series for the target of the search
            {
            x: [molData[0].components[0]],
            y: [molData[0].components[1]],
            text: [encodeURIComponent(molData[0].smiles)],
            hovertemplate: "( %{x}, %{y})",
            hovermode: "closest",
            type: 'scatter',
            mode: 'markers',
            marker: {color: 'red', size: 12 , 
                    symbol: "triangle-up",
                    line: {
                        width: 2,
                        color: 'DarkSlateGrey'}},
            name: 'Target'
            },
            // Creating the data series for the neighbors
          {
            x: neighbors.map( row => { return row.components[0] }),
            y: neighbors.map( row => { return row.components[1] }),
            text: neighbors.map( row => { return encodeURIComponent(row.smiles) }),
            hovertemplate: "( %{x}, %{y})",
            hovermode: "closest",
            type: 'scatter',
            mode: 'markers',
            marker: {color: 'SlateGrey', size: 12 ,
                    symbol: 'triangle-down', 
                    line: {
                        width: 2,
                        color: 'DarkSlateGrey'}},
            name: 'Neighbor'
          }
        ]}
        layout={ { 
          autosize: true,
          useResizeHandler: true,
          style: {width: '100%', height: '100%'},
          xaxis: {
            title: {
              text: molData[0].type + componentArray[0],
              font: {
                size: 18,
                color: '#7f7f7f'
              }
          }
        },
    
        yaxis: {
          title: {
            text: molData[0].type + componentArray[1],
            font: {
              size: 18,
              color: '#7f7f7f'
            }
        }
      }
        } }
      />
    return (
        myPlot
      );
    }

    // Loadmore neighbors
    function loadMore() {
        setSkip(skip => skip + interval);
        setSearchPage( searchPage => searchPage + 1);
        setIsLoadingMore(true);
    }

    // Search new neighbors
    function newSearch() {
        setSkip(0);
        setSearchPage(1);
        setSVGResults([]);
        setResults([]);
        // Just need to toggle this to make sure it toggles
        // so that effect will be triggered
        setIsLoading(true);
        setSearchToggle(!searchToggle);
        setMolData([]);
    }
 
    function loadImages() {

        const fetchData = async () => {
            const moleculeData = await NeighborSearch(moleculeid, type, components, interval, skip);
            return moleculeData
        }

        fetchData()
        .catch( (error) => {
            console.log(error) 
            setValidMolecule(false);
            setResults([]);
            setSVGResults([])
            setIsLoading(false)
            setIsLoadingMore(false) 
        } )
        .then( (items )=> {
            console.log(items);
            setMolData(items);
            console.log(isLoading);
            console.log(validMolecule);

            // if (searchPage == 1) {
            // setSVGResults(items[1]);
            // setResults(items[0]);
            // }

            // else {
            //     setSVGResults(svg_results.concat(items[1]));
            //     setResults(results.concat(items[0]) )
            // }

            setIsLoading(false);
            setIsLoadingMore(false);
            setValidMolecule(true);

          })

    }

    // initial load of data 
    useEffect( ( ) => { 
        loadImages() }, 

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ searchPage, searchToggle ] 
    );

    function _handleKeyDown(event) {
        if (event.key === "Enter") {
          loadImages();
        }
      }

    return (
        <Container maxWidth="lg">
        <h2>Neighbor Search</h2>
        <TextField 
                  style = {{width: 350}}
                  sx={{ m: 0.5}}
                  id="search-outline" 
                  label="Enter a Molecule ID to Search" 
                  variant="outlined"
                  defaultValue= {moleculeid} 
                  onChange = { event => setSearch( event.target.value ) }
                  onKeyDown = { (e) => _handleKeyDown(e) }
                  InputProps={{endAdornment: <Button onClick={ () => { newSearch() } } 
                  >
                    Search
                    </Button>}}
        />
        <TextField
            sx={{ m: 0.5 }}
            select
            id="dimension-outline"
            value={type}
            onChange={event => setType(event.target.value)}
        >
            <MenuItem value={"pca"}>PCA</MenuItem>
            <MenuItem value={"umap"}>UMAP</MenuItem>
        </TextField>
        <TextField
                  sx={{ m: 0.5}} 
                  id="component-outline" 
                  label="Enter Components" 
                  variant="outlined"
                  defaultValue= {components} 
                  onChange = { event => setComponents( event.target.value ) }
        />

        <Container sx={{display: 'flex', justifyContent: 'center', my: 3}}>
            <Box sx={{ display: 'flex' }}>
            { !isLoading && !validMolecule && <Typography>No results found for Molecule ID.</Typography> } 
            </Box>
            <Box sx={{ display: 'flex' }}>
            { !isLoading && validMolecule && Object.keys(molData).length > 0 && <Typography>Results.</Typography> && <Container>{ Graph() }</Container> } 
            </Box>
        </Container>
        </Container>
    )
}
