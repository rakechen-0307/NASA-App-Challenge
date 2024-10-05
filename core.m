function result_fig = core(file)

%% Init
result_fig = figure('Visible','off');
sgtitle("Seismic Detection Process");
plot_count = 5;
line_width = 1.2;

%% Hyperparameters
frequency_band = [0.5 2]; % band for the band-pass filter
smoothing_std = 6e2; % std of the Gaussian smoothing
peak_std_num = 2; % number of std to be recognized as a peak (recommend 2~3)
slope_threshold = 5e-13; % largest slope (abs) to be recognized a a quake
slope_ratio_threshold = 2;

fprintf("Reading data...\n")
data_table = readtable(file, 'VariableNamingRule', 'preserve');
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
filterOrder = 30;
d = designfilt('bandpassfir', ...       % Response type
       'FilterOrder',filterOrder, ...   % Filter order
       'StopbandFrequency1',0.5, ...    % Frequency constraints
       'PassbandFrequency1',0.55, ...
       'PassbandFrequency2',1.95, ...
       'StopbandFrequency2',2, ...
       'DesignMethod','ls', ...         % Design method
       'StopbandWeight1',1, ...         % Design method options
       'PassbandWeight', 1, ...
       'StopbandWeight2',1, ...
       'SampleRate',1/ts);               % Sample rate
bp_filter_coef = d.Coefficients;
sig_augmented = [zeros(1, length(bp_filter_coef) - 1), velocity'];
velocity = zeros(1, length(velocity_original));
for ii = 1:length(velocity)
    velocity(ii) = sum(sig_augmented(ii:ii+filterOrder) .* bp_filter_coef);
end
subplot(plot_count, 1, 2)
plot(time, velocity, "LineWidth", line_width)
title("Step1: Bandpass Filter"); xlabel("Time (s)"); ylabel("Velocity (m/s)");
velocity = velocity';

%% Step 2: Absolute Value + Smoothing + Normalization
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

%% Step 3: Find Peaks + Slopes
% Find peaks
[peaks, peak_indices, level] = peaksfinder(velocity, peak_std_num, 0.3);
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

% Step 4: Select the Peaks
peaks = [];
slopes = [];
for i = 1:size(peak_indices, 1)
    if (abs(right_slopes(i)) < slope_threshold) && (slope_ratios(i) > slope_ratio_threshold)
        peaks = [peaks peak_indices(i, 1)];
        slopes = [slopes left_slopes(i)];
    end
end
subplot(plot_count, 1, 5); hold on;
plot(time, velocity_original, "LineWidth", line_width);
if ~isempty(peaks)
    for i = 1:length(peaks)
        x1 = peaks(i);
        y1 = velocity(x1);
        x0 = x1 - y1 / slopes(i);
        xline(x0 * ts, "LineWidth", line_width, "Color", "red");
    end
end
title("Step4: Pick Peaks"); xlabel("Time (s)"); ylabel("Velocity (m/s)");
