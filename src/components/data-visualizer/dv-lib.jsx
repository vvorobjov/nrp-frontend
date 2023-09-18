import { Button } from 'react-bootstrap';
import { Accordion } from 'react-bootstrap';
import { Card } from 'react-bootstrap';
import { Dropdown, DropdownButton, Form } from 'react-bootstrap';
import './data-visualizer.css';

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
            +++ X Range, Y Range, Refreshing freq?, filename?, more?
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
            </Accordion>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}

export function GraphTypeSelector_DD() {
  return (
    <Dropdown>
      <Dropdown.Toggle id="dropdown-basic">
        Graph Type
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item >Line Plot</Dropdown.Item>
        <Dropdown.Item >Pie Plot</Dropdown.Item>
        <Dropdown.Item >Scatter Plot</Dropdown.Item>
        <Dropdown.Item >Bar Plot</Dropdown.Item>
        <Dropdown.Item >Fill Area</Dropdown.Item>
        <Dropdown.Item >Error Bars</Dropdown.Item>
        <Dropdown.Item >Scatter 3D</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

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

export function DataVisualizerAccordion() {
  return (
    <Accordion>
      <Card>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Click me!
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey="0">
          <Card.Body>Hello! I'm the body</Card.Body>
        </Accordion.Collapse>
      </Card>
      <Card>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey="1">
              Click me!
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey="1">
          <Card.Body>Hello! I'm another body</Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}
