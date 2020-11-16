import React from 'react';
import experimentsService from '../../services/proxy/experiments.js';

class ExperimentBox extends React.Component {
    render() {
        return (
        <div className="experiment-box">
            {this.props.value}
        </div>
        );
    }
}

class ExperimentList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            experiments : null, 
        }
    }
    async componentDidMount() {
        // replace the token here with a token found in your database in ~/.opt/nrpStorage/FS_db/users for testing
        try {
            const experiments = await experimentsService.getExperiments('27f3988c-ccfe-4519-921c-b804a966d708');
            this.setState({
                experiments : experiments,
            });
        }
        catch (error) {
            console.error(`Failed to fetch the list of experiments. Error: ${error}`);
        }
    }
    renderExperiment(experiment) {
        return (
            <li key={experiment.configuration.id}>
                <ExperimentBox
                    value={experiment.configuration.name}
                />
            </li>
        );
    }
    render() {
        if (this.state.experiments){
            return(this.state.experiments.then(file => {
                file.forEach(experiment => {
                    this.renderExperiment(experiment);
                })
            })
            ); 
        } else {
            return null;
        }
    }
}

export default class ExperimentContainer extends React.Component {
    render (){
        return(
        <div className='experiment-container'>
            <div className="experiment-list">
                <ol>
                    <ExperimentList/>
                </ol>
            </div>
        </div>
        );
    }
}