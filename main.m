clear; clc; close all

%% Parameter Settings

% Choose which celestial body: 'lunar' or 'mars'
target_body = 'mars';

% Give filepath (absolute or relative are both fine, must be .csv)
filepath = "D:\NASA_Hackathon\NASA-App-Challenge\data\mars\test\data\XB.ELYSE.02.BHV.2019-05-23HR02_evid0041.csv";
% Save figure? (true: save
save_figure = false;

% If save figure, assign its location. DO NOT add file extension (ex. .png)
figure_save_location = "D:\NASA_Hackathon\NASA-App-Challenge\hello";

%% Initialize hyperparameters

if strcmp(target_body, 'lunar')
    smoothing_std = 6e2;            % std of the Gaussian smoothing
    peak_std_num = 2;               % number of std to be recognized as a peak
    slope_ratio_threshold = 1.5;    %
    detect_level = 0.3;
    load ./filter/lunar_bpf.mat
else
    smoothing_std = 3e2;            % std of the Gaussian smoothing
    peak_std_num = 1.3;             % number of std to be recognized as a peak (recommend 2~3)
    slope_ratio_threshold = 1.5;    %
    detect_level = 0.3;
    load ./filter/mars_bpf.mat
end

% Open a figure
result_fig = figure;
sgtitle("Seismic Detection Process");
plot_count = 5;
line_width = 1.2;

%% Load data
fprintf("Reading data...\n")
data_table = readtable(filepath, 'VariableNamingRule', 'preserve');
fprintf("Data read.\n")
time = data_table{:, 2};
velocity = data_table{:, 3};
velocity_original = velocity; % save a copy
ts = time(2) - time(1); % sampling time

% plot original signal
subplot(plot_count, 1, 1);
plot(time, velocity, "LineWidth", line_width);
title("Original Signal"); xlabel("Time (s)"); ylabel("Velocity (m/s)");

%% Step 1: Bandpass Filter
velocity = conv(velocity_original, bp_filter_coef, 'same');

% plot signal after bandpass
subplot(plot_count, 1, 2)
plot(time, velocity, "LineWidth", line_width)
title("Step1: Bandpass Filter"); xlabel("Time (s)"); ylabel("Velocity (m/s)");
bp_signal = velocity;

%% Step 2: Envelope Generation

% Absolute value
velocity = abs(velocity);

% Gaussian smoothing
window_size = 6 * smoothing_std;
x = -floor(window_size / 2):1:floor(window_size / 2);
gaussian_kernel = exp(-x .^ 2 / (2 * smoothing_std ^ 2));
gaussian_kernel = gaussian_kernel / sum(gaussian_kernel);
velocity = conv(velocity, gaussian_kernel, 'same');

% Normalization
average = mean(velocity);
velocity = velocity - average;
velocity = velocity .* (velocity >= 0);

% Plot
subplot(plot_count, 1, 3);
plot(time, velocity, "LineWidth", line_width);
title("Step2: Absolute Value + Smoothing + Normalization"); xlabel("Time (s)"); ylabel("Velocity (m/s)");
envelope_generation_signal = velocity;
%% Step 3: Find Peaks + Slopes

% Find peaks
[peaks, peak_indices, level] = peaksfinder(velocity, peak_std_num, detect_level);
subplot(plot_count, 1, 4); hold on;
plot(time, velocity, "LineWidth", line_width);
title("Step3: Find Peaks & Slopes"); xlabel("Time (s)"); ylabel("Velocity (m/s)");
xline(peak_indices(:, 2) * ts, "LineWidth", line_width, "Color", "red");
yline(level, "LineWidth", line_width, "Color", "cyan");

% Slopes
left_slopes = zeros(length(peak_indices), 1);
right_slopes = zeros(length(peak_indices), 1);
slope_ratios = zeros(length(peak_indices), 1);
for i = 1:size(peak_indices, 1)
    left = peak_indices(i, 1);
    mid = peak_indices(i, 2);
    right = peak_indices(i, 3);
    left_slope = (velocity(mid) - velocity(left)) / (mid - left);
    right_slope = (velocity(right) - velocity(mid)) / (right - mid);
    ratio = abs(left_slope / right_slope);
    % Store results
    left_slopes(i) = left_slope;
    right_slopes(i) = right_slope;
    slope_ratios(i) = ratio;
end

% Plot
for i = 1:size(peak_indices, 1)
    % slope
    plot(ts * peak_indices(i, :), velocity(peak_indices(i, :)), "LineWidth", line_width, "Color", "green" , "LineStyle", "--");
    % ratio
    x0 = peak_indices(i, 2);
    x1 = x0 + slope_ratios(i) * 5e3;
    y0 = peaks(i);
    plot(ts * [x0, x1], [y0, y0], "LineWidth", line_width, "Color", "magenta")
end
hold off;

%% Step 4: Select the Peaks
peaks = [];
end_events = [];
lower_slopes = [];
upper_slopes = [];
for i = 1:size(peak_indices, 1)
    % if (abs(right_slopes(i)) < slope_threshold) && (slope_ratios(i) > slope_ratio_threshold)
    if (slope_ratios(i) > slope_ratio_threshold)
        peaks = [peaks peak_indices(i, 2)];
        lower_slopes = [lower_slopes left_slopes(i)];
        upper_slopes = [upper_slopes right_slopes(i)];
    end
end
subplot(plot_count, 1, 5); hold on;
ylim([min(velocity_original), max(velocity_original)]);

if ~isempty(peaks)
    for i = 1:length(peaks)
        x1 = peaks(i);
        y1 = velocity(x1);
        x0 = x1 - y1 / lower_slopes(i);
        x2 = x1 - y1 / upper_slopes(i);
        xline(x0 * ts, "LineWidth", line_width, "Color", "red");
        % xline(x2 * ts, "LineWidth", line_width, "Color", "green");
        p1 = patch([x0 x2 x2 x0]*ts, [min(velocity_original), min(velocity_original), max(velocity_original), max(velocity_original)], 'green');
        p1.FaceVertexAlphaData = 0.2;
        p1.FaceAlpha = 'flat';
        p1.EdgeColor = 'none';
    end
end
plot(time, velocity_original, "LineWidth", line_width);

title("Step4: Pick Peaks"); xlabel("Time (s)"); ylabel("Velocity (m/s)");

%% Store the figure
if save_figure
    saveas(result_fig, figure_save_location, 'png');
end