import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import httpHelper from './helpers/httpHelper';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            items: []
        };
    }

    async componentDidMount() {
        let items = await httpHelper.get('api/items');

        this.setState({
            items
        });
    }

    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h2>Welcome to React</h2>
                </div>
                <p className="App-intro">
                    Trying to load Fibonacci Sequence from Server API:
                </p>
                {this.state.items.length &&
                <ul>
                    {this.state.items.map((item, index) =>
                        <li key={index} style={{listStyleType: 'none'}}>{item}</li>
                    )}
                </ul>
                }
            </div>
        );
    }
}

export default App;
