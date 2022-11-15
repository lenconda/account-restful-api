import FusionAuthClient from '@fusionauth/typescript-client';

const client = new FusionAuthClient(
    'GfkPIXqtLybDIJ_HYZCLdKt7FOvBfu2c8lUrgrWgFN_2hgyzhujAGBIS',
    'https://login.lenconda.top',
);

client.retrieveUser('b01a4d7f-6e03-4b8e-b1d0-b7ce535bc716').then((response) => console.log(response));
