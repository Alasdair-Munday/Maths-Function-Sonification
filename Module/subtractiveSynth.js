/**
 * Created by Alasdair Munday on 17/04/2016.
 */
angular.module('MathsFunctionSonification').service('subtractiveSynth', function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    var playing = false;
    var c = {};

    c.fMin = 200;
    c.fxSemitoneRatio = 24/2;



    c.osc1 =  audioContext.createOscillator();
    c.osc2 = audioContext.createOscillator();
    c.amp = audioContext.createGain();
    c.filter = audioContext.createBiquadFilter();
    c.lfo = audioContext.createOscillator();

    //the two oscillators

    c.osc1.type = 'sawtooth';
    c.osc1.start();
    c.osc2.type = 'square';
    c.osc2.start();
    c.sub = audioContext.createOscillator();
    c.sub.start();



    //the gain node at the oscilators output

    c.amp.gain.value = 0;
    //the detune between the two oscilators
    c.detune = 5;


    c.filter.type = 'bandpass';

    c.lfo.frequency.value = 0;
    c.lfo.start();
    c.filter.Q.value = 10;

    var lfoGain = audioContext.createGain();
    lfoGain.gain.value =  300;
    c.lfo.connect(lfoGain);

    c.filter.frequency = 400;
    lfoGain.connect(c.filter.detune);


    //setup audio graph
    c.osc1.connect(c.filter);
    c.osc2.connect(c.filter);
    var subAmp = audioContext.createGain();
    subAmp.gain.value = 0.2;

    c.sub.connect(subAmp);
    subAmp.connect(c.amp);

    c.filter.connect(c.amp);

    if(audioContext.createStereoPanner) {
        c.panner = audioContext.createStereoPanner();
        c.amp.connect(c.panner);
        c.panner.connect(audioContext.destination);
    }else{
        c.amp.connect(audioContext.destination)
    }


    c.setNoteRange = function(fMax,fMin,yMax,yMin){
        c.fMin = fMin;
        var semitones = 12*Math.log2(fMax/fMin);

        var yRange = yMax - yMin;

        c.fxSemitoneRatio = semitones/yRange;
    };

    c.getPitch = function(fx){

        var n = fx* c.fxSemitoneRatio;

        return Math.pow(2,n/12)* c.fMin;
    };

    //methods
    c.setFrequency = function(frequency){
        c.osc1.frequency.value = frequency;
        c.osc2.detune.value = c.detune;
        c.osc2.frequency.value = frequency/2;
        c.sub.frequency.value = frequency/2;
    };

    c.sonifyValues = function(fx,dx,dx2){
        c.lfo.frequency.value = 3* Math.abs(dx) ;
        c.filter.frequency.value = 200 + 50*Math.abs(dx2);
        c.setFrequency(c.getPitch(fx));
    };

    c.start = function () {
        c.amp.gain.value = 1;
        playing = true;
    };

    c.stop = function(){
        c.amp.gain.value = 0;
        playing = false;
    };

    c.toggle = function(){
        c.amp.gain.value = playing? 0:1;
        playing = ! playing;
    };

    c.pan = function(x){
        if(c.panner)
            c.panner.pan.value = x;
    };



    return c;
});