**Python Exercice using Regular Expression**
====================

The aim of that little exercice on Python is to scan through wikipedia articles and retrieve a date for every article. For that we use the REGEX librairy on Python (re) and we wimply describe the most regular date expression structure in variables. Then we look for these structures in the articles under the assumption that the first date from top to bottom is the date of the article.

>>
import re

"""months=("January","February","March","April","May","June","July","August","September","October","November","December")"""

datePattern1 = re.compile("(\d* [A-Z][a-z]* \d\d\d\d)")
datePattern2 = re.compile("([A-Z][a-z]* \d*, \d\d\d\d)")
datePattern3 = re.compile("( \d\d\d\d )")
datePattern4 = re.compile("(\d+th centur[a-z]+)")

result=open("ie_date_evaluation.txt","w")

with open("wikifirst.txt") as file:
    pageTitle=""
    for line in file:
        if pageTitle=="":
            pageTitle=line[:-1]
            continue
        if line=="\n":
            pageTitle=""
            continue
        
        match=re.search(datePattern1, line)
        if match!=None:
            print pageTitle + "\thasDate\t" + match.group()
            result.write(pageTitle + "\thasDate\t" + match.group()+"\n")
            continue
            
        match=re.search(datePattern2, line)
        if match!=None:
            print pageTitle + "\thasDate\t" + match.group()
            result.write(pageTitle + "\thasDate\t" + match.group()+"\n")
            continue

        match=re.search(datePattern3, line)
        if match!=None:
            print pageTitle + "\thasDate\t" + match.group()
            result.write(pageTitle + "\thasDate\t" + match.group()+"\n")
            continue

        match=re.search(datePattern4, line)
        if match!=None:
            print pageTitle + "\thasDate\t" + match.group()
            result.write(pageTitle + "\thasDate\t" + match.group()+"\n")
            continue
>> 
