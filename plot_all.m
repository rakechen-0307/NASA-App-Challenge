clear;
close all;
clc; 

target_body = 'lunar'; % 'lunar' or 'mars'
target_folder = 'test';
figure_folder_name = "plots";

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

    % date = strings(length(file_name), 1);
    % evid_num = strings(length(file_name), 1);

    fileid = fopen(strcat(folder_name, "/result.csv"), "w");
    fprintf(fileid, "filename, time_rel(sec)\n");
    for file_num = 1:length(file_name)
    %for file_num = 11:11
        fprintf("%d/%d for folder %d/%d\n", file_num, length(file_name), ii, length(dirData))
        full_name = file_name(file_num).name;
        if strcmp(full_name, "result.csv") == 1
            continue
        end
        % date(file_num) = full_name(15:24);
        % evid_num = full_name(34:38);
        if strcmp(target_body, 'lunar') == 1
            [peak_time, result_fig] = core_lunar(strcat(folder_name, "/", full_name));
        else
            [peak_time, result_fig] = core_mars(strcat(folder_name, "/", full_name));
        end

        saveas(result_fig, strcat(folder_name, "/", figure_folder_name, "/", full_name(1:end-4), ".png"));
        close(result_fig);
        for peak_num = 1:length(peak_time)
            fprintf(fileid, "%s,%f\n", full_name, peak_time(peak_num));
        end
    end
    fclose(fileid);
end
