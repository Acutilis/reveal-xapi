# reveal-xapi 

A [Reveal.js](https://revealjs.com/) plugin that implements xAPI tracking for the main RevealJS events.

It uses the [ADL xapiwrapper library](https://github.com/adlnet/xAPIWrapper) for the core xAPI functionality.


## Background

This plugin was developed initially in the context of [Torrance Learning's xAPI Cohort](https://www.torrancelearning.com/xapi-cohort/), spring 2018, for the project established by team-ilt-xapi.


## Project directories

The /reveal-xapi directory contains just the plugin files (the plugin code and the required library). This is what you should put in the `plugins` directory of your revealjs presentation.

For convenience, the demo from [Reveal.js](https://revealjs.com/) has been included in the `demo` directory, with the plugin already set up, and the necessary code in the main html file (`index.html`)

## Usage

The easiest way to proceed is to copy the `demo` directory and then change the Reveal presentation within the `index.html` file to suit your needs.

The key points for proper usage of the plugin are:

1. In the head of the main html file, include the xapiwrapper:

```
<!-- ADL xapi wrapper -->
<script src="plugin/reveal-xapi/xapiwrapper.min.js" type="text/javascript"></script>
```

2. For local testing, in the script at the end of the `body` you can hardcode the LRS configuration and actor:
       
```
// ADL LRS Configuration - Basic Auth for demo purposes⋅⋅
if(ADL.XAPIWrapper.lrs.actor == undefined) {
    var conf = {
       "endpoint" : "http://your.lrs.com/data/xAPI/",
       "auth" : "Basic " + toBase64('username:password'),
       "actor" : '{"mbox": "mailto:reveal-user@somedomain.com","name": "RevealJS User","objectType": "Agent"}'
    };

    ADL.XAPIWrapper.changeConfig(conf);⋅
}
```
Embedding the endpoint, credentials and actor in the content is not a good idea, it should not be done. This should only be done for testing.
This `index.html` file can be launched with the 'tincan' method (passing the endpoint, credentials and actor in the query string of the url).

3. In that same script (at the end of the body), in the `Reveal.initialize` call add the plugin depencency to the dependencies array:
```
{ src: 'plugin/reveal-xapi/reveal-xapi.js', async: true }
```
4. In the `Reveal.initialize` call, add `activityId`, and optionally add `activityName` and `activityDescription`. These data items will be used to build the Object in the Statements.

```
activityId: 'http://www.mypresentations.com/demos/pres1',⋅
activityName: 'A demo RevealJS presentation.',
activityDescription: 'Just a demo presentation to test the xAPI plugin.',
```
That `activityId` corresponds to the whole presentation, so it will only be used in Statements that refer to the presentation as a whole ('initialized' and 'terminated'). Statements that refer to Slides ('attempted' and 'viewed') will build the activityId by concatenating the global activityId and the _slide reference_. The _slide reference_ will be one of two things. If you add a `title` attribute to the section tag corresponding to that slide, that title will be used as the slide reference  (spaces will be replaced by '_' and everything will be lowercase). If the slide has no title, the reference will be the Reveal Indices of the slide: <horizontal>_<vertical>, for example 3_2. Indexing starts at 0.
So, for example, a Statement about a slide could  have an  activityId like: 'http://www.mypresentations.com/demos/pres1/2_1'.
For statements related to slide fragments, the activityId is built in a similar way: if the fragment has a title, it will be used. If not, the fragment number will be used. Thus, a Statemet about a fragment being show, for example, could have an activityId like: 'http://www.mypresentations.com/demos/pres1/2_1/2', meaning the third fragment (number 2) of slide 2_1.

5. As mentioned above, add the `title` attribute to the slide or fragment tags, if you want to see more descriptive information in your statements.

## Statements sent

- **initialized** (http://adlnet.gov/expapi/verbs/initialized) when the presentation is loaded.
- **terminated** (http://activitystrea.ms/schema/1.0/terminate) when tab/window is closed, or the user navigates away from the presentation.
- **attempted** (http://adlnet.gov/expapi/verbs/attempted) when the user navigates to a slide (the object is the new slide).
- **viewed** (http://id.tincanapi.com/verb/viewed) when the user navigates away from a slide (the object is the old slide).
- **viewed** (http://id.tincanapi.com/verb/viewed) when a fragment (of a slide) is shown.
- **hid** (https://xapi.xapicohort.com/revealjs/verb/hid) when a fragment (of a slide) is hidden.
- **activated** (http://xapi.xapicohort.com/revealjs/verb/activated) when the user activates the Presentation Overview.
- **deactivated** (http://xapi.xapicohort.com/revealjs/verb/deactivated) when the Presentation Overview is deactivated.

As shown, there are three custom verbs that refer to revealjs specifically. I've chosen arbitrary URIs for these. They may change in the future.

## Extensions and Activity Types

There are some custom extensions and activity types as well, for information that is specific to revealjs. Again, the URIS may change in the future:

Extensions:

    - https://xapi.xapicohort.com/revealjs/extension/session-id
    - https://xapi.xapicohort.com/revealjs/extension/slide-index

Activity types:

    - https://xapi.xapicohort.com/revealjs/activity-type/presentation
    - https://xapi.xapicohort.com/revealjs/activity-type/slide
    - https://xapi.xapicohort.com/revealjs/activity-type/presentationOverview
    - https://xapi.xapicohort.com/revealjs/activity-type/fragment

All these custom URIs have been chosen quite hastily just to get this plugin out. If you want to use others, just change them in the source code.

The convenience of using/defining new verbs or reusing existing ones, or creating specific vocabularies for this use case is something that should be discussed among interested parties (the members of team-ilt-xapi of the xAPI Cohort and beyond), and ideally it should be done as part of an initiative to create an xAPI Profile, if it looks like one is needed. It is a bit too early for all that.
