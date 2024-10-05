clear;
close all;
clc; 

target_body = 'mars'; % 'lunar' or 'mars'
target_folder = 'test';
figure_folder_name = "self_filter_plots_30_newalg";

warning('off', 'MATLAB:MKDIR:DirectoryExists');

root_name = strcat("./data/", target_body, "/", target_folder, "/data/");
if strcmp(target_body, 'lunar') == 1
    dirData = dir(root_name);
    dirData = dirData(3:end);
else
    dirData = 1;
end

% Remove . and .. and
for ii = 1:length(dirData)
    if strcmp(target_body, 'lunar') == 1
        folder_name = strcat(root_name, dirData(ii).name);
    else
        folder_name = root_name;
    end
    mkdir(folder_name, figure_folder_name)
    file_name = dir(strcat(folder_name, "/*.csv"));

    date = strings(length(file_name), 1);
    evid_num = strings(length(file_name), 1);
    for file_num = 1:length(file_name)
        fprintf("%d/%d for folder %d/%d\n", file_num, length(file_name), ii, length(dirData))
        full_name = file_name(file_num).name;
        % date(file_num) = full_name(15:24);
        % evid_num(file_num) = full_name(34:38);
        result_fig = core(strcat(folder_name, "/", full_name));
        saveas(result_fig, strcat(folder_name, "/", figure_folder_name, "/", full_name(1:end-4), ".png"));
        close(result_fig);
    end
end
