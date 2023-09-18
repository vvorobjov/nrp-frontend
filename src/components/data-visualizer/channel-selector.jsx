import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { Modal, Button, Form, Col, Row } from 'react-bootstrap';
import Plot from 'react-plotly.js';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';

export default class ChannelSelector extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedFilename: '',
      code: ''
    };
  }

  async componentDidMount() {
    return false;
  }

  test2(){
    return(<h3>Hello Cruel World</h3>);
  }

  test3(){
    return(
      <Form.Group controlId="exampleForm.ControlSelect1">
        <Form.Check>
          abc
        </Form.Check>
        <Form.Control as="select">
          <option>Joint Angle 1</option>
          <option>Joint Angle 2</option>
          <option>Joint Angles 3</option>
          <option>Joint Speed 1</option>
          <option>Joint Speed 2</option>
          <option>Joint Speed 3</option>
        </Form.Control>
        <Form.Text>
          abc
        </Form.Text>
        <Button>
          Update
        </Button>
      </Form.Group>
    );
  }

  test4(){
    return(
      <Form.Group controlId="exampleForm.ControlSelect1">
        <Form.Label> Select Topic </Form.Label>
        <Form.Control as="select">
          <option>Joint Angle 1</option>
          <option>Joint Angle 2</option>
          <option>Joint Angles 3</option>
          <option>Joint Speed 1</option>
          <option>Joint Speed 2</option>
          <option>Joint Speed 3</option>
        </Form.Control>
      </Form.Group>
    );
  }


  render(){
    return(
      <div>{this.test3()}</div>
    );
  }
}
