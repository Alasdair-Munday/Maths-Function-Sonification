/**
 * Created by Alasdair Munday on 17/04/2016.
 * with thanks to https://github.com/nelsonsilva/webaudio-sandbox
 */

angular.module('MathsFunctionSonification').service('formantSynth',function(){

    var nFreq = 5;

    //formant database
    var formants = {
        a: [{F:600, BW:60, G:1},{F:1040, BW:70, G:0.4466835922 },{F:2250,BW:110,G:0.3548133892}, {F:2450,BW:120, G:0.3548133892},{F:2750,BW:130, G:0.1}],
        e: [{F:400, BW:40, G:1},{F:1620, BW:80, G:0.2511886432 },{F:2400,BW:100, G:0.3548133892}, {F:2800,BW:120, G:0.2511886432},{F:3100,BW:120, G:0.1258925412}],
        i: [{F:250, BW:60, G:1},{F:1750, BW:90, G:0.0316227766},{F:2600, BW:100, G:0.1584893192}, {F:3050,BW:120, G:0.07943282347},{F:3340,BW:120, G:0.03981071706}],
        o: [{F:400, BW:40, G:1},{F:750, BW:80, G:0.2818382931 },{F:2400,BW:100, G:0.08912509381}, {F:2600,BW:120, G:0.1},{F:2900,BW:120, G:0.01}],
        u: [{F:350, BW:40, G:1},{F:600, BW:80, G:0.1},{F:2400, BW:100, G:0.02511886432}, {F:2675,BW:120, G:0.01},{F:2950,BW:120, G:0.01584893192}]
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

    if(context.createStereoPanner) {
        c.panner = context.createStereoPanner();
        output.connect(c.panner);
        c.panner.connect(context.destination);
    }else{
        output.connect(context.destination)
    }



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

        filters.push({filter:filter,gain:gain});

    }

    function useFormant(f, brightness){
        if( typeof f == "string") {
            f = formants[f];
        }
        for(var i = 0; i< nFreq; i++) {
            var formant = f[i];
            var filter = filters[i].filter;
            var gain = filters[i].gain;
            filter.frequency.value = formant.F;
            gain.gain.value = brightness? formant.G * brightness :  formant.G;

            //find Q from bandwidth and cutoff frequency
            // BW = Fc / Q <=> Q = Fc / BW
            filter.Q.value = formant.F / (formant.BW / 2);

        }
    }

    c.pan = function(x){
        if(c.panner)
            c.panner.pan.value = x;
    };

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
        c.fMin = fMin/2;

        fMax = fMax/2;
        fMin = fMin/2;

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
        useFormant(f,Math.abs(dx2)+0.5);
        setFrequency( getPitch(fx));
        vib.frequency.value = dx2*2;
    };

    function getFormantForSlope(slope){
        var pos = Math.abs(slope);
        var  maxSlope = 8;

        //stop error if out of bounds by returning highest value
        if(pos> maxSlope) {
            var l = letters[letters.length-1];
            return formants[l];
        }

        //find the distance between letters
        var fWidth = Math.floor(maxSlope / (letters.length-1));

        //index of the letter on the left
        var idx = Math.floor(pos/fWidth);

        //find the formant for the letter on the left
        var l1 = letters[idx];
        var f1 = formants[l1];

        //index of the letter on the right
        idx++;
        var l2 = letters[idx];
        var f2 = formants[l2];

        //find ratio of distance between the two formants
        var dx = (pos/fWidth % 1);
        var dx2 = 1-dx;

        var formant = [];

        for( var i = 0; i < f1.length; i++) {
            formant.push({
                F: f1[i].F + (f2[i].F - f1[i].F)*dx,
                BW: f1[i].BW +(f2[i].BW - f1[i].BW)*dx,
                G: f1[i].G + (f2[i].G - f1[i].G)*dx
            });
        }

        return formant;
    }

    return c;

});