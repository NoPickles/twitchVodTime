
function calcTime(vodInfo){
    //add endTime to data array.
    vodInfo.map(calcEndTime);

    var index = vodInfo.findIndex(findinVod);

    timeinVod(vodInfo, index);
};

function calcEndTime(info){
    var created = info.created_at;
    var createdTime = new Date(created).getTime(); //Epoch time of vod create date

    
    var lengthVod = info.duration;
        lengthVod = lengthVod.split(/[a-z]/);
    
    var miliLengthVod = (lengthVod[0] * 3600000) + (lengthVod[1] * 60000) + (lengthVod[2] * 1000);

    var endedEpoc = createdTime + miliLengthVod;

    info.durationMili = miliLengthVod;
    info.endedEpoc = endedEpoc;
    info.createdEpoc = createdTime;
};

function findinVod(vodInfo){
    return(vodInfo.searchEpoch <= vodInfo.endedEpoc && vodInfo.searchEpoch >= vodInfo.createdEpoc);
};

function timeinVod(vodInfo, index){
    var searchDuration = (vodInfo[index].searchEpoch - vodInfo[index].createdEpoc);
    var vodTime = msToTime(searchDuration);
    openVod(vodInfo, vodTime);
};

function msToTime(duration){
    var milliseconds = parseInt((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours   = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours   = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + "h" + minutes + "m" + seconds + "s";
  };

function openVod(info, time){
    var index  = info.findIndex(findinVod);
    var vodURL = info[index].url;

    window.open(vodURL + "?t=" + time);
};

function getTwitchID(name){

    url = 'https://api.twitch.tv/kraken/users?login=' + name;

    let urlParams = new URLSearchParams(window.location.hash.replace("#","?"));
    let bearer = "Bearer " + urlParams.get('access_token');

    $.ajax({
        type:"GET",
        url:url,
        headers: {
            'Client-ID':'ky1r27xst71xcnslvvpegftytpi48f', //CHANGE THIS !!!
            'Authorization' : bearer,
        },
        async: true,
        dataType: "json",
        success: function(data){
            getVodData(data);
        },
        error: function(errorMessage){
            alert("name error");
        }
    });
};

//TODO Make vod search go to more than 100

function getVodData(channel){
    var url = 'https://api.twitch.tv/helix/videos?user_id=' + channel.users[0]._id + '&first=100&type=archive';

    var searchTime = getTime();

    console.log('searchTime :' + searchTime);

    var urlParams = new URLSearchParams(window.location.hash.replace("#","?"));
    let bearer = "Bearer " + urlParams.get('access_token');


    $.ajax({
        type:"GET",
        url:url,
        headers: {
            'Client-ID':'ky1r27xst71xcnslvvpegftytpi48f', //!! CHANGE !!
            'Authorization': bearer,
        },
        async: true,
        dataType: "json",
        success: function(data){
            data.data.map(x => x.searchEpoch = searchTime);
            console.log(data.data);
            calcTime(data.data);
        },
        error: function(errorMessage){
            alert("Error");
        }
    });
};

function getTime(){

    let dateTime = $('#dateTime').val();
    let doneTime;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let a = moment.tz(dateTime, tz); //moment format with timezone

    let select = $('input[name=group1]:checked', '#timeForm').val();

    if(select === 'local'){
        doneTime = a.utc().format(); //Converts local time to UTC time
    } else {
        doneTime = dateTime + 'Z';
    }

    //Returns DoneTime in unix time miliseconds
    return moment(doneTime).valueOf();
};


$('#submit').click(function(){
    //TODO convert time to something less dumb

    var twitchChannel = $('#twitch').val();

    getTwitchID(twitchChannel);
});


$(document).ready(function(){
    
});