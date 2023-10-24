import { Button } from 'react-bootstrap';
import { Accordion } from 'react-bootstrap';
import { Card } from 'react-bootstrap';
import { Dropdown, DropdownButton, Form } from 'react-bootstrap';
import './data-visualizer.css';

/**
 * Generates the elements for setting up the detailed properties of the graph.
 * @param {} - nothing
 * @returns {JSX} DetailedProperties - JSX Element with interface for selecting the detailed properties for the plot.
 */
export function DetailedProperties() {
  // TODO replace hard coded cards and items in the body by the real graph properties
  return (
    <Accordion>
      <Card>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Detailed graph porperties
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <Accordion>
              <Card>
                <Card.Header>
                  <Accordion.Toggle as={Button} variant="link" eventKey="0">
                      X Axis
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="0">
                  <Card.Body>
                    Range Auto / Mauallly defiend  (check boxes)
                    X - max
                    X - min
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
              <Card>
                <Card.Header>
                  <Accordion.Toggle as={Button} variant="link" eventKey="1">
                      Y Axis
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="1">
                  <Card.Body>
                    Range Auto / manually defined (check boxes)
                    Y - max
                    Y - min
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
              <Card>
                <Card.Header>
                  <Accordion.Toggle as={Button} variant="link" eventKey="2">
                      Data Points
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="2">
                  <Card.Body>
                    Select the amount of values from the buffered channel to use in the plot
                    Or Select the amount of time to plot
                    Select filter types
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
              <Card>
                <Card.Header>
                  <Accordion.Toggle as={Button} variant="link" eventKey="3">
                      file details
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="3">
                  <Card.Body>
                    Select the filename that plots will have after downloaded
                    Select the image format
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}

/**
 * Generates the elements for selecting the graph type.
 * @param {} - nothing
 * @returns {JSX} GraphTypeSelector - JSX Element with drop down menu. TODO: Raplace with NRP3 interface.
 */
export function GraphTypeSelector() {
  return (
    <Form.Group controlId="exampleForm.ControlSelect1">
      <Form.Control as="select">
        <option>Line Plot</option>
        <option>Pie Plot</option>
        <option>Scatter Plot</option>
        <option>Bar Plot</option>
        <option>Fill Area</option>
        <option>Scatter 3D 3</option>
      </Form.Control>
    </Form.Group>
  );
}
