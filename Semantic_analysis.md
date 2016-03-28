#Python Exercice using Regular Expression - Date identification#
==================================================================

The aim of that little exercice on Python is to scan through wikipedia articles and retrieve a date for every article. For that we use the REGEX librairy on Python (re) and we wimply describe the most regular date expression structure in variables. Then we look for these structures in the articles under the assumption that the first date from top to bottom is the date of the article.

<code>
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
<code> 

#Python Exercice using Regular Expression - category identification#
======================================================================

This second excercice on Python is about finding the a category for each wikipedia articles using REGEX. For example Jeames Dean should be flagged as an "actor". For that we use the REGEX librairy on Python (re) and we look for structures like " Jeames Dean is a" which would typically be followed by the type of the article.

<code>
import re,string

typePattern3 = re.compile("[A-z]*[a-z]* of ")
"""typePattern2 = re.compile("[A-z]*[a-z]* in ")"""
typePattern2 = re.compile("[A-z]*[a-z]* that|when|which|whichever|whichsoever|who|whoever|whosoever|whom|whomever|whomsoever|whose|whosesoever|whatever|whatsoever")
typePattern1 = re.compile("is a [a-z]+|is an [a-z]+|is the [a-z]+|was a [a-z]+|was an [a-z]+|was the [a-z]+|are a [a-z]+|are an [a-z]+|are the [a-z]+|were a [a-z]+|were an [a-z]+|were the [a-z]+")


result=open("ie_types_evaluation.txt","w")

with open("wikifirst.txt") as file:
    pageTitle=""
    for line in file:
        if pageTitle=="":
            pageTitle=line[:-1]
            continue
        if line=="\n":
            pageTitle=""
            continue
        
        match=re.search(typePattern2, line)
        if match!=None:
            catch=match.group()
            print catch
            separateur=string.find(catch," ")
            category=catch[0:separateur]
            print pageTitle + "\ttype\t" + category
            result.write(pageTitle + "\ttype\t" + category+"\n")
            continue
        
        match=re.search(typePattern3, line)
        if match!=None:
            catch=match.group()
            print catch
            separateur=string.find(catch," ")
            category=catch[0:separateur]
            print pageTitle + "\ttype\t" + category
            result.write(pageTitle + "\ttype\t" + category+"\n")
            continue

        match=re.search(typePattern1, line)
        if match!=None:
            catch=match.group()
            print catch
            separateur=string.rfind(catch," ")
            category=catch[separateur:]
            print pageTitle + "\ttype\t" + category
            result.write(pageTitle + "\ttype\t" + category+"\n")
            continue
        
        match=re.search(typePattern4, line)
        if match!=None:
            catch=match.group()
            print catch
            separateur=string.find(catch," ")
            category=catch[0:separateur]
            print pageTitle + "\ttype\t" + category
            result.write(pageTitle + "\ttype\t" + category+"\n")
            continue

<code>
