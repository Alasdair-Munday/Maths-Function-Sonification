/**
 * Created by Alasdair Munday on 17/04/2016.
 * with thanks to https://github.com/nelsonsilva/webaudio-sandbox
 */

angular.module('MathsFunctionSonification').service('formantSynth',function(){

    var nFreq = 6;

    //formant database
    var formants = {
        w: [{F:290, BW:50},{F:610, BW:80},{F:2150, BW:60}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],
        u: [{F:350, BW:65},{F:1250, BW:110},{F:2200, BW:140}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],
        o: [{F:550, BW:80},{F:960, BW:50 },{F:2400,BW:130}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],
        a: [{F:700, BW:130},{F:1220, BW:70 },{F:2500,BW:160}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],
        //e: [{F:480, BW:70},{F:1720, BW:100 },{F:2520,BW:200}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],
        //i: [{F:310, BW:45},{F:2020, BW:200},{F:2960, BW:400}, {F:3300,BW:250},{F:3750,BW:200},{F:4900,BW:1000}],

    };

    var letters = Object.keys(formants);

    //get the web audio context
    var context = new (window.AudioContext || window.webkitAudioContext)();

    var source;
    var sub;
    var output;
    var playing = false;
    var vib;
    var vibGain;

    var filters = [];

    var c = {};

    c.fMin = 200;
    c.fxSemitoneRatio = 24/2;

    //gain node for routing to output
    output = context.createGain();
    output.gain.value = 0;

    c.panner = context.createStereoPanner();

    output.connect(c.panner);
    c.panner.connect(context.destination);

    sub = context.createOscillator();
    var osc = context.createOscillator();
    osc.type = 'sawtooth';
    sub.frequency.value = osc.frequency.value = c.fMin;
    osc.start();
    sub.start();

    source = osc;
    var subGain = context.createGain();
    subGain.gain.value = 0.25;
    sub.connect(subGain);
    subGain.connect(output);


    vib = context.createOscillator();
    vibGain = context.createGain();
    vib.connect(vibGain);
    vibGain.connect(source.detune);
    vibGain.gain.value = 40;
    vib.start();

    for(var i = 0; i < nFreq; i++) {
        var filter = context.createBiquadFilter();
        filter.type = 'bandpass';

        var gain = context.createGain();
        gain.gain.value =  1;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        filters.push(filter);

    }

    function useFormant(f){
        if( typeof f == "string") {
            f = formants[f];
        }
        for(var i = 0; i< nFreq; i++) {
            var formant = f[i];
            var filter = filters[i];
            filter.frequency.value = formant.F;

            //find Q from bandwidth and cutoff frequency
            // BW = Fc / Q <=> Q = Fc / BW
            filter.Q.value = formant.F / (formant.BW / 2);

        }
    }

    c.start = function () {
        output.gain.value = 1;
        playing = true;
    };

    c.stop = function(){
        output.gain.value = 0;
        playing = false;
    };

    c.toggle = function(){
        output.gain.value = playing? 0:1;
        playing = ! playing;
    };

    c.setNoteRange = function(fMax,fMin,yMax,yMin){
        c.fMin = fMin;
        var semitones = 12*Math.log2(fMax/fMin);

        var yRange = yMax - yMin;

        c.fxSemitoneRatio = semitones/yRange;
    };

    function getPitch(fx){

        var n = fx* c.fxSemitoneRatio;

        return Math.pow(2,n/12)* c.fMin;
    }

    //methods
    function setFrequency(frequency){
        source.frequency.value = frequency;
        sub.frequency.value = frequency;
    }

    c.sonifyValues = function(fx,dx,dx2){
        var f = getFormantForSlope(dx);
        useFormant(f);
        setFrequency( getPitch(fx));
        vib.frequency.value = dx2*2;
    };

    function getFormantForSlope(slope){
        var pos = Math.abs(slope);
        var  maxSlope = 6;
        if(pos> maxSlope) {
            var l = letters[letters.length-1];
            return formants[l];
        }


        var fWidth = Math.floor(maxSlope / letters.length);
        var idx = Math.floor(pos/fWidth);
        var dx = pos % fWidth;

        var l1 = letters[idx];
        var f1 = formants[l1];

        var f1Dx = dx - (fWidth / 2);
        //console.log("DX = " + f1Dx);
        var f1W = 1 - (Math.abs(f1Dx) / fWidth);

        idx+=(f1Dx<0)?-1:1;
        if(idx<0){ idx=0;}
        if(idx>letters.length-1){ idx=letters.length-1;}
        var l2 = letters[idx];
        var f2 = formants[l2];
        var f2W = 1 - f1W;

        var formant = [];

        for( var i = 0; i < f1.length; i++) {
            formant.push({
                F: (f1[i].F * f1W) + (f2[i].F * f2W) ,
                BW: (f1[i].BW * f1W) + (f2[i].BW * f2W)
            });
        }

        return formant;
    }

    return c;

});