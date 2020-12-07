import { rest } from 'msw'
var experiments = [
  {
    'uuid': 'braitenberg_husky_holodeck_1_0_0',
    'name': 'braitenberg_husky_holodeck_1_0_0',
    'owned': true,
    'joinableServers': [],
    'configuration': {
      'maturity': 'production',
      'timeout': 840,
      'timeoutType': 'real',
      'name': 'Holodeck Husky Braitenberg experiment_changed_name',
      'tags': [
        'husky',
        'robotics',
        'holodeck',
        'braitenberg'
      ],
      'thumbnail': 'ExDXMLExample.jpg',
      'description': 'This experiment loads the Husky robot from Clearpath Robotics in the Holodeck environment.\n        If the user starts the experiment, the Braitenberg vehicle network is executed\n        and the robot will turn around itself in place, until the camera detects a red color. Then,\n        the robot will move towards the colored object. In this experiment, the user can interact\n        and change the color of both screens by clicking on them with the right mouse button.',
      'cloneDate': '2019-11-19 16:35:55',
      'cameraPose': [
        5.056826,
        -1.0210998,
        2.6975987,
        0,
        0,
        0.49999
      ],
      'experimentFile': '<ExD \n  xmlns:xsi=\'http://www.w3.org/2001/XMLSchema-instance\' \n  xmlns=\'http://schemas.humanbrainproject.eu/SP10/2014/ExDConfig\' xsi:schemaLocation=\'http://schemas.humanbrainproject.eu/SP10/2014/ExDConfig ../ExDConfFile.xsd\'>\n  <name>Holodeck Husky Braitenberg experiment_changed_name</name>\n  <thumbnail>ExDXMLExample.jpg</thumbnail>\n  <description>This experiment loads the Husky robot from Clearpath Robotics in the Holodeck environment.\n        If the user starts the experiment, the Braitenberg vehicle network is executed\n        and the robot will turn around itself in place, until the camera detects a red color. Then,\n        the robot will move towards the colored object. In this experiment, the user can interact\n        and change the color of both screens by clicking on them with the right mouse button.</description>\n  <tags>husky robotics holodeck braitenberg</tags>\n  <timeout>840</timeout>\n  <configuration type=\'3d-settings\' src=\'ExDXMLExample.ini\' />\n  <configuration type=\'brainvisualizer\' src=\'brainvisualizer.json\' />\n  <configuration type=\'user-interaction-settings\' src=\'ExDXMLExample.uis\' />\n  <maturity>production</maturity>\n  <environmentModel src=\'virtual_room.sdf\'>\n    <robotPose robotId=\'husky\' x=\'0.0\' y=\'0.0\' z=\'0.5\' roll=\'0.0\' pitch=\'-0.0\' yaw=\'3.14159265359\' />\n  </environmentModel>\n  <bibiConf src=\'bibi_configuration.bibi\' />\n  <cameraPose>\n    <cameraPosition x=\'5.056825994369357\' y=\'-1.0210998541555323\' z=\'2.697598759953974\' />\n    <cameraLookAt x=\'0\' y=\'0\' z=\'0.49999\' />\n  </cameraPose>\n  <cloneDate>2019-11-19T16:35:55</cloneDate>\n</ExD>',
      'bibiConfSrc': 'bibi_configuration.bibi',
      'visualModel': null,
      'visualModelParams': []
    },
    'id': 'braitenberg_husky_holodeck_1_0_0',
    'private': true
  },
  {
    'uuid': 'template_new_0',
    'name': 'template_new_0',
    'owned': true,
    'joinableServers': [],
    'configuration': {
      'maturity': 'production',
      'timeout': 840,
      'timeoutType': 'real',
      'name': 'test',
      'tags': [],
      'thumbnail': 'TemplateNew.jpg',
      'description': 'This new experiment is based on the models that you have selected. You are free to edit the description.',
      'cloneDate': '2019-11-19 16:46:40',
      'cameraPose': [
        4.5,
        0,
        1.8,
        0,
        0,
        0.6
      ],
      'experimentFile': '<ns1:ExD xmlns:ns1=\'http://schemas.humanbrainproject.eu/SP10/2014/ExDConfig\'>\n  <ns1:name>test</ns1:name>\n  <ns1:thumbnail>TemplateNew.jpg</ns1:thumbnail>\n  <ns1:description>This new experiment is based on the models that you have selected. You are free to edit the description.</ns1:description>\n  <ns1:timeout>840.0</ns1:timeout>\n  <ns1:configuration src=\'brainvisualizer.json\' type=\'brainvisualizer\'/>\n  <ns1:configuration src=\'TemplateNew.ini\' type=\'3d-settings\'/>\n  <ns1:configuration src=\'user-settings.uis\' type=\'user-interaction-settings\'/>\n  <ns1:maturity>production</ns1:maturity>\n  <ns1:environmentModel model=\'hbp_virtual_room\' src=\'virtual_room.sdf\'>\n    <ns1:robotPose pitch=\'0.0\' robotId=\'hbp_clearpath_robotics_husky_a200_0\' roll=\'0.0\' x=\'-0.662432968616\' y=\'-0.0223822146654\' yaw=\'0.0\' z=\'0.168474584818\'/>\n  </ns1:environmentModel>\n  <ns1:bibiConf src=\'bibi_configuration.bibi\'/>\n  <ns1:cameraPose>\n    <ns1:cameraPosition x=\'4.5\' y=\'0.0\' z=\'1.8\'/>\n    <ns1:cameraLookAt x=\'0.0\' y=\'0.0\' z=\'0.6\'/>\n  </ns1:cameraPose>\n  <ns1:cloneDate>2019-11-19T16:46:40</ns1:cloneDate>\n</ns1:ExD>\n',
      'bibiConfSrc': 'bibi_configuration.bibi',
      'visualModel': null,
      'visualModelParams': []
    },
    'id': 'template_new_0',
    'private': true
  }
]
export const handlers = [
  rest.get('http://localhost:9000/proxy/storage/experiments', (req, res, ctx) => {
    return res(
      ctx.json(experiments)
    )
  })
]