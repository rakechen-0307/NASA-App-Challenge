function [values, locations, level] = peaksfinder(y, std_num, width_factor)
    %% Prepare
    % Calculate Average and STD
    mu = mean(y);
    sigma = std(y);
    % Calculate STD Levels
    level = mu + sigma .* std_num;

    %% Main Calculation
    locations = cell(1, 1);
    values = cell(1, 1);

    % Calculate crossing points
    crossing_indices = [find((y(1:end - 1) < level & y(2:end) > level) | (y(1:end - 1) > level & y(2:end) < level))];
    right_most_index = 1;
    for i = 1:length(crossing_indices) - 1
        % Peak merging
        if (crossing_indices(i) <= right_most_index)
            continue;
        end

        % Find peaks
        segment_indices = crossing_indices(i):crossing_indices(i + 1);
        segment = y(segment_indices);
        [max_value, max_index] = max(segment);
        max_index = max_index + crossing_indices(i) - 1; % local to global index
        if max_value <= level
            continue;
        end

        % Calculate peak size
        left_index = find(y(1:max_index) <= max_value * width_factor, 1, "last");
        right_index = find(y(max_index:end) <= max_value * width_factor, 1, "first");
        if isempty(left_index)
            left_index = 1;
        end
        if isempty(right_index)
            right_index = length(y);
        end
        right_index = right_index + max_index - 1; % local to global index
        right_most_index = max_index + right_index - left_index; % for peak merging

        % Store Results
        locations{1} = [locations{1}; [left_index, max_index, right_index]];
        values{1} = [values{1}; max_value];
    end
    locations = locations{1};
    values = values{1};
end