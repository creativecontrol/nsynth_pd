--[[ Assumes samples are linearly spaced in pitch.
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
--]]

local function inverse_index(values)
    local index={}
    for k,v in pairs(values) do
        index[v]=k
    end
    return index
end

local ChooseSampleGrid = pd.Class:new():register("choosesamplegrid")

function ChooseSampleGrid:initialize(sel, atoms)
    self.inlets = 6
    self.outlets = 4

    -- External arguments
    self.steps_per_samp = 4
    self.steps_per_inst = 13
    self.n_inst_x = 11
    self.n_inst_y = 22
    self.x = 0
    self.y = 0
    self.min_pitch = 34

    -- Internal variables
    self.inst = {0, 0, 0, 0}
    self.vol = {1.0, 1.0, 1.0, 1.0}
    self.max_pitch = 84
    self.grid_x = {0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0}
    self.grid_x_idx = inverse_index(self.grid_x)
    self.grid_y = {0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0}
    self.grid_y_idx = inverse_index(self.grid_y)
    self.step_x = 0.1
    self.step_y = 0.1
end

-- LUA arrays are, by convention, 1 based. Need to convert
-- Call each time n_inst_x or n_inst_y changes
function ChooseSampleGrid:set_grid()
    for i=0,self.n_inst_x do
        self.grid_x[i] = i / (self.n_inst_x - 1)
    end
    for i=0,self.n_inst_y do
        self.grid_y[i] = i / (self.n_inst_y - 1)
    end
    self.step_x = 1 / (self.n_inst_x - 1)
    self.step_y = 1 / (self.n_inst_y - 1)
end

function ChooseSampleGrid:set_inst_and_vol()
    -- Find nearest instruments
    if self.x == 0
    then
        self.high_x = 1
    else
        self.high_x = self.grid_x_idx[self.x]
    end
    if self.y == 0
    then
        self.high_y = 1
    else
        self.high_y = self.grid_y_idx[self.y]
    end

    self.low_x = self.high_x - 1
    self.low_y = self.high_y - 1
end
