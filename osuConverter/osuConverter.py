# Author      : Isaac Zhou
# Date Created: Jun 06, 2022
# Last Updated: Jun 09, 2022
# Description : Condense data in .osu files; extract note charts and convert them into simpler data.
# Note        : This program only runs in a local environment.

# The converted data syntax: [laneNumber, time, endTime]
# laneNumber - the number indicating which lane the note will appear in, starting at zero, counting from left to right
# time       - the time from the song's start when the note hits the judgment line in miliseconds
# endTime    - (only for hold notes) the time from the song's start when the end of the hold note hits the judgment ine in miliseconds; value is -1 for normal notes

import math

hitObject = False
data = ['\0'] * 3

original = open("original.txt","r",encoding="utf-8")
converted = open("converted.txt","w")

text = []
text = original.readlines()

for i in range(len(text)):
    if hitObject and len(text[i]):
        temp = text[i].split(',')
        # from https://osu.ppy.sh/wiki/en/Client/File_formats/Osu_%28file_format%29#holds-(osu!mania-only)
        # calculate the column number based on the formula given in the link above
        data[0] = str(math.floor(int(temp[0])*4/512))

        # from https://osu.ppy.sh/wiki/en/Client/File_formats/Osu_%28file_format%29#type
        # if bit 0 is 1, the note is a normal note; if bit 7 is 1, the note is a hold note.
        if int(temp[3]) & 1:
            data[1] = temp[2]
            data[2] = "-1"
        elif int(temp[3]) & 1<<7:
            data[1] = temp[2]
            data[2] = temp[5].split(':')[0] # hold notes have an extra property - the end time
        converted.write('['+','.join(data)+"],\n") # add square brackets and comma to match JavaSript sytax
    if "HitObjects" in text[i]:
        hitObject = True

original.close()
converted.close()