
function calcTime(vodInfo, searchT){
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
    console.log(vodInfo);
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
    var index = info.findIndex(findinVod);
    var vodURL = info[index].url;

    window.open(vodURL + "?t=" + time);
};

function getTwitchID(name){

    url = 'https://api.twitch.tv/kraken/users?login=' + name;


    $.ajax({
        type:"GET",
        url:url,
        headers: {
            'Client-ID':'sphrze7vu0w52xj352puzh4q1covnzv',
            'Accept'   : 'application/vnd.twitchtv.v5+json'
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

function getVodData(channel){
    var url = 'https://api.twitch.tv/helix/videos?user_id=' + channel.users[0]._id + '&first=100';

    var searchTime = $('#timestamp').val();
        searchTime = new Date(searchTime).getTime();

    var urlParams = new URLSearchParams(window.location.hash.replace("#","?"));
    let bearer = "Bearer " + urlParams.get('access_token');

    $.ajax({
        type:"GET",
        url:url,
        headers: {
            'Client-ID':'ky1r27xst71xcnslvvpegftytpi48f',
            'Authorization': bearer,
        },
        async: true,
        dataType: "json",
        success: function(data){
            data.data.map(x => x.searchEpoch = searchTime);
            var found = calcTime(data.data, searchTime);
        },
        error: function(errorMessage){
            alert("Error");
        }
    });
};


$('#submit').click(function(){
    //TODO convert time to something less dumb

    var twitchChannel = $('#twitch').val();

    getTwitchID(twitchChannel);
});


$(document).ready(function(){
    
});