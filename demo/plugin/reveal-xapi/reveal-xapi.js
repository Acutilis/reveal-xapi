// revealxAPI

var revealxAPI = window.revealxAPI || (function(){
    var actor = JSON.parse(ADL.XAPIWrapper.lrs.actor); //actor is going to be the same for the whole activity
    var revealSessionId = 'someSessionId'; // THIS will really come from the server; use same id for all participants in a session.
    var revealXObject;
    var activityID;
    var activityName;
    var activityDescription;
    var XW = ADL.XAPIWrapper;  //short ref
    var ltiSessionId = null;
    var previousSlideIndex;

    if (Reveal.isReady()) {
        onReady(null);
    } else {
        Reveal.addEventListener( 'ready', onReady);
    }

    function  onReady(ev) {
        var actId = Reveal.getConfig().activityId;
        // calc activityIdBase from Reveal.activityId  activityName, activityDescription.
        if (!actId) {
            alert('activityId missing. Please initialize Reveal with an activityId (must be an URI). You should also provide activityName and activityDescription. This session will use a meaningless activityId (THIS IS NOT GOOD FOR YOUR DATA!)');
            Reveal.acivityId = 'http://www.meaningless.com/somexAPIActivity/' + Math.floor(Math.random()* 1000000);
        } 
        activityID  = actId[actId.length -1] == '/' ? actId : actId + '/';
        activityName = Reveal.getConfig().activityName || '';
        activityDescription = Reveal.getConfig().actividyDescription || '';

        revealXObject = new ADL.XAPIStatement.Activity(activityID);
        revealXObject.definition = {type: 'https://xapi.xapicohort.com/revealjs/activity-type/presentation'};

        if (typeof(activityName) == 'object') {
            revealXObject.definition.name = activityName;
        } else {
            revealXObject.definition.name = { 'en-US': activityName};
        }
        if (typeof(description) == 'object') {
            revealXObject.definition.description = activityDescription;
        } else {
            revealXObject.definition.description = { 'en-US': activityDescription};
        }
        // Now hook up all the events that we want to report as xAPI statements.
        Reveal.addEventListener('slidechanged', onSlideChanged);
        Reveal.addEventListener('overviewshown', onOverviewShown);
        Reveal.addEventListener('overviewhidden', onOverviewHidden);
        Reveal.addEventListener('fragmentshown', onFragmentShown);
        Reveal.addEventListener('fragmenthidden', onFragmentHidden);
        // need to figure out how to hook arbitrary widgets that might be placed in slides.
        onInitialized();
        previousSlideIndex = getSlideIndex();
    }

    function getSlideIndex() {
        return Reveal.getState().indexh + '_' + Reveal.getState().indexv;
    }

    // xAPI-specific functions
    function getSlideXObject(slide) {
        // use the slide title, if it exists, to build the id of the object. Otherwise, use the slide index: h_v (less informative)
        var t = (slide.title).replace(/\s+/g,'_').toLowerCase();
        var id;
        var slideRef;
        if (!t || t=='') {  //use previous slide index
            slideRef = previousSlideIndex;
        } else {
            slideRef = t;
        }
        id = activityID + slideRef;
        var slideXObject = new ADL.XAPIStatement.Activity(id);
        slideXObject.definition = {type: 'https://xapi.xapicohort.com/revealjs/activity-type/slide'};
        slideXObject.definition.name = {'en-US': slideRef};
        return slideXObject;
    }

    function bareStatement() {
       var st =  new ADL.XAPIStatement();
       st.id = ADL.ruuid();  // this shouldn't really be used.
       st.timestamp = (new Date()).toISOString();
       st.actor = actor;
       return st;
    }

    function onInitialized() {
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('http://adlnet.gov/expapi/verbs/initialized','initialized');
        statement.object = revealXObject;
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
        window.addEventListener("beforeunload", function (e) {
            onTerminated();
        });
    }

    function onSlideChanged(ev) {
        // send 'exit previous' and  'attemped new one'
        // available info: ev.previousSlide, ev.currentSlide, ev.indexh, ev.indexv.   The 1st two are refs to DOM objects.
        // TODO: Add timing information to include in the result (data-time can indicate the average experience time for a slide). Need to measure timings.
        var statement1 = bareStatement();
        statement1.verb = new ADL.XAPIStatement.Verb('http://id.tincanapi.com/verb/viewed','viewed');
        statement1.object = getSlideXObject(ev.previousSlide);
        statement1.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        // important: update previousSlideIndex after building statement1 but before building statement1
        // IMPORTANT: updtae previousSlideIndext but not use getSlideIndex() because it uses Reveal.getState, and 
        // Reveal's state is in flux at this point, and the slide index info is not reliable.
        previousSlideIndex = ev.indexh + '_' + ev.indexv;  

        var statement2 = bareStatement();
        statement2.verb = new ADL.XAPIStatement.Verb('http://adlnet.gov/expapi/verbs/attempted','attempted');
        statement2.object = getSlideXObject(ev.currentSlide, ev.indexh);
        statement2.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }

        XW.sendStatements([statement2, statement1]);
        console.log('sent: ', [statement2, statement1]);
    }

    function getOverviewXObject() {
        var id = activityID + 'PRESENTATION_OVERVIEW'
        var overviewXObject = new ADL.XAPIStatement.Activity(id);
        overviewXObject.definition = {type: 'https://xapi.xapicohort.com/revealjs/activity-type/presentationOverview'};
        return overviewXObject;
    }

    function onOverviewShown(ev) {
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('http://xapi.xapicohort.com/revealjs/verb/activated','activated');
        statement.object = getOverviewXObject();
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
    }

    function onOverviewHidden(ev) {
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('http://xapi.xapicohort.com/revealjs/verb/deactivated','deactivated');
        statement.object = getOverviewXObject();
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
    }

    function getFragmentXObject(fragment) {
        // use the fragment title, if it exists, to build the id of the object. Otherwise, use the fragment index: h_v/f (less informative)
        // where f is the sequence # of this fragment in this slide.
        var slideIndex = getSlideIndex();
        var currentSlide = Reveal.getCurrentSlide();
        var t = (currentSlide.title).replace(/\s+/g,'_').toLowerCase();
        var id;
        var slideRef;
        var fragmentRef;
        if (!t || t=='') {  
            //id = activityID + slideIndex + '/';
            slideRef = slideIndex;
        } else {
            //id = activityID + t + '/';
            slideRef = t;
        }
        var fragT = (fragment.title).replace(/\s+/g,'_').toLowerCase();
        var fragId;
        var fragIndex = null;
        var frags = currentSlide.querySelectorAll(".fragment");
        for(var i=0; i<frags.length; i++) {
            //if (fragment.className.indexOf('current-fragment') > -1) {
            //if (frags[i].className.indexOf('current-fragment') > -1) {
            if (frags[i] == fragment) {
                fragIndex = i;
                break;
            }
        }
        if (fragIndex == null ) {
            //could not find index. Something weird happened, bail out.
            return;
        }
        if (!fragT || fragT=='') { 
            //id = id + fragIndex;
            fragmentRef = fragIndex;
        } else {
            //id = id + fragT;
            fragmentRef = fragT;
        }
        id = activityID + slideRef + '/' + fragmentRef;
        var fragmentXObject = new ADL.XAPIStatement.Activity(id);
        fragmentXObject.definition = {type: 'https://xapi.xapicohort.com/revealjs/activity-type/fragment'};
        fragmentXObject.definition.name = {'en-US': 'fragment ' + fragmentRef + ' of slide ' + slideRef };
        return fragmentXObject;
    }

    function onFragmentShown(ev) {
        // ev.fragment : ref to the DOM element
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('http://id.tincanapi.com/verb/viewed','viewed');
        statement.object = getFragmentXObject(ev.fragment);
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
    }

    function onFragmentHidden(ev) {
        // ev.fragment : ref to the DOM element
        // ev.fragment : ref to the DOM element
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('https://xapi.xapicohort.com/revealjs/verb/hid','hid');
        statement.object = getFragmentXObject(ev.fragment);
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
    }

    function onTerminated(ev) {
        // ev.fragment : ref to the DOM element
        // ev.fragment : ref to the DOM element
        var statement = bareStatement();
        statement.verb = new ADL.XAPIStatement.Verb('http://activitystrea.ms/schema/1.0/terminate','terminated');
        statement.object = revealXObject;
        statement.context = {
            extensions: {
                'https://xapi.xapicohort.com/revealjs/extension/session-id': revealSessionId,
                'https://xapi.xapicohort.com/revealjs/extension/slide-index': previousSlideIndex
            }
        }
        XW.sendStatement(statement);
        console.log('sent: ', statement);
    }

})();


