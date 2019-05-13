//Assumes samples are linearly spaced in pitch.
//Assumes samples are an ordered list (0_inst_0_pitch_min, ..., 1_inst_0_pitch_max, 2_inst_1_pitch_min, ...)
//Plays two samples at once, and mixes between them with equal power interpolation.
//Args:
//  min_pitch: Pitch of lowest samples.
//  steps_per_samp: Pitch spacing (in halfsteps) between samples for a given instrument.
//  samps_per_inst: Number of samples at different pitches for a given instrument.
//  n_inst_x: Number of instruments to space linearly between 0 and 1. (ex. 3, 0-----1------2)
//  x: Interpolation value between 0 and 1.
//
//Returns:
//  samp: Which sample to play.
//  pitch_shift: How much to shift the pitch.
//  vol_sound_1: Loudness to play sample 1
//  vol_sound_2: Loudness to play sample 2

//declare inlets and outlets
inlets = 6;
outlets = 4;

// External arguments
var steps_per_samp = 4;
var samps_per_inst = 13;
var n_inst_x = 11;
var n_inst_y = 11;
var x = 0;  //Range [0-1]
var y = 0;
var min_pitch = 34;  // Pitch of lowest sample for instrument

// Internal variables
var inst = [0, 0, 0, 0];
var vol = [1.0, 0.0, 0.0, 0.0];
var max_pitch = 84;  // Pitch of highest sample for instrument
var grid_x = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0]
var grid_y = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0]
var step_x = 0.1
var step_y = 0.1



// Call each time n_inst_x or n_inst_y changes
function set_grid()
{
	for (i = 0; i < n_inst_x; i++) {
		grid_x[i] = i / (n_inst_x - 1);
	}
	for (i = 0; i < n_inst_y; i++) {
		grid_y[i] = i / (n_inst_y - 1);
	}
	step_x = 1 / (n_inst_x - 1)
	step_y = 1 / (n_inst_y - 1)
}

function findIndex(a, f) {
	for (i=0; i < a.length; i++) {
		if (f(a[i])) {return i}
	}
}


// Call each time x or y changes
function set_inst_and_vol()
{
	// Find nearest instruments
	if (x == 0) {
		high_x = 1;
	} else {
		high_x = findIndex(grid_x, function f(v) {return x <= v});
	}
	if (y == 0) {
		high_y = 1;
	} else {
		high_y = findIndex(grid_y, function f(v) {return y <= v});
	}
	low_x = high_x - 1;
	low_y = high_y - 1;

	post("max_pitch:" + max_pitch + "\n");
	post("low_x: " + low_x + " low_y: " + low_y + " x: " + x + " y: " + y + " gx: " + grid_x[low_x] + " gy: " + grid_y[low_y] + "\n");
	// 2-D grid [(0,0), (1,0), (0,1), (1,1)]
	// samp = "row major" [velocity, pitch, x, y]
	x_idxs = [low_x, high_x, low_x,  high_x]
	y_idxs = [low_y, low_y,  high_y, high_y]

	post

	for (i=0; i < 4; i++) {
		inst[i] = x_idxs[i] + n_inst_x * y_idxs[i]
	}

	// interpolate between 4 samples bounded [0-1]
	if (x == 0) {
		xv = 0;
	} else {
		xv = (x - grid_x[low_x]) / step_x
	}
	if (y == 0) {
		yv = 0;
	} else {
		yv = (y - grid_y[low_y]) / step_y
	}

	post("xv: " + xv + " yv: " + yv);
	vol = [(1-xv) * (1-yv),
		   (xv)   * (1-yv),
		   (1-xv) * (yv),
		   (xv)   * (yv)];

	// Equal power interp. (spherical) TODO
	outlet(2, vol);
	outlet(3, inst);
}


//add the built in function of msg_float() so it does something when it receives a float
function msg_int(v)
{
	//Note In
	if (inlet==0) {
		pitch = v;
		// Deterimine which sample to use
		samp = Math.floor((pitch - min_pitch) / steps_per_samp);
		samp = Math.min(Math.max(samp, 0), samps_per_inst-1);
		samples = []
		for (i=0; i < 4; i++) {
			samples[i] = samp + inst[i] * samps_per_inst + 1;
		}

		// Determine pitch shift
		if      (pitch <= min_pitch) pitch_shift = pitch - min_pitch;
		else if (pitch >= max_pitch) pitch_shift = pitch - max_pitch;
		else pitch_shift = (pitch - min_pitch) % steps_per_samp; // - Math.floor(steps_per_samp / 2);

		// Assign variables to outlets
		outlet(0, samples);
		outlet(1, pitch_shift);
		outlet(2, vol);
		outlet(3, inst);
	}
	//assign inlets with if statements
	if (inlet==1) {
		steps_per_samp = v;
		max_pitch = min_pitch + steps_per_samp * (samps_per_inst - 1);
	}
	if (inlet==2) {
		samps_per_inst = v;
		max_pitch = min_pitch + steps_per_samp * (samps_per_inst - 1);
	}
	if (inlet==5) {
		min_pitch = v;
		set_inst_and_vol();
	}
}


function bang()
{
//	outlet(0,"myvalue","is",myval);
}

function msg_float(v)
{
}


function list()
{
	var v = arrayfromargs(arguments);
	if (inlet==3) {
		if (v.length==2) {
			n_inst_x = v[0];
			n_inst_y = v[1];
			set_grid();
		}
	}
	if (inlet==4) {
		if (v.length==2) {
			x = v[0];
			y = v[1];
			set_inst_and_vol();
		}
	}
}

function anything()
{
//	var a = arrayfromargs(messagename, arguments);
//	post("received message " + a + "\n");
//	myval = a;
//	bang();
}
